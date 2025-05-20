"use client"
import {useState, useEffect} from 'react';
import {Search, Upload, Folder, FileText, Image, Video, Music, Download, MoreVertical, Grid} from 'lucide-react';
import {createSupabaseClient} from "@/lib/supabase/client";

const supabase = createSupabaseClient();
const FileManager = () => {
    const [mediaFiles, setMediaFiles] = useState({
        images: {count: 0, size: 0},
        videos: {count: 0, size: 0},
        audios: {count: 0, size: 0},
        apps: {count: 0, size: 0},
        documents: {count: 0, size: 0},
        downloads: {count: 0, size: 0},
    });

    const [folders, setFolders] = useState<any[]>([]);
    const [totalStorage, setTotalStorage] = useState(0);
    const [usedStorage, setUsedStorage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch file statistics from Supabase
        const fetchFileStats = async () => {
            setIsLoading(true);

            try {
                // Get all files metadata from our database
                const {data: files, error} = await supabase
                    .from('files')
                    .select('*');

                if (error) throw error;

                // Process files to get stats
                const stats = {
                    images: {count: 0, size: 0},
                    videos: {count: 0, size: 0},
                    audios: {count: 0, size: 0},
                    apps: {count: 0, size: 0},
                    documents: {count: 0, size: 0},
                    downloads: {count: 0, size: 0},
                };

                let totalSize = 0;

                files.forEach(file => {
                    const fileType = getFileType(file.mime_type);
                    if (stats[fileType]) {
                        stats[fileType].count += 1;
                        stats[fileType].size += file.size;
                        totalSize += file.size;
                    }
                });

                setMediaFiles(stats);
                setUsedStorage(totalSize);

                // Get folders
                const {data: folderData, error: folderError} = await supabase
                    .from('folders')
                    .select('*');

                if (folderError) throw folderError;
                setFolders(folderData);

                // Get storage quota
                const {data: userData, error: userError} = await supabase
                    .from('user_storage')
                    .select('*')
                    .single();

                if (userError && userError.code !== 'PGRST116') throw userError;

                if (userData) {
                    setTotalStorage(userData.total_storage);
                } else {
                    setTotalStorage(1024 * 1024 * 1024 * 160); // Default 160GB
                }
            } catch (error) {
                console.error('Error fetching file stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFileStats();

        // Set up real-time subscription for file changes
        const filesSubscription = supabase
            .channel('schema-db-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'files'
            }, () => {
                fetchFileStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(filesSubscription);
        };
    }, []);

    // Helper function to determine file type from mime type
    const getFileType = (mimeType: string) => {
        if (!mimeType) return 'documents';

        if (mimeType.startsWith('image/')) return 'images';
        if (mimeType.startsWith('video/')) return 'videos';
        if (mimeType.startsWith('audio/')) return 'audios';
        if (mimeType.startsWith('application/') &&
            (mimeType.includes('executable') || mimeType.includes('x-msdownload'))) return 'apps';
        if (mimeType.startsWith('application/') || mimeType.includes('text/')) return 'documents';

        return 'downloads';
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';

        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));

        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatGigaBytes = (bytes: number) => {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };

    const calculatePercentage = (used: number, total: number) => {
        return ((used / total) * 100).toFixed(0) + '%';
    };

    const handleFileUpload = async (e: { target: { files: any[]; }; }) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Upload file to Supabase Storage
            const filePath = `uploads/${Date.now()}_${file.name}`;
            const {data, error} = await supabase.storage
                .from('files')
                .upload(filePath, file);

            if (error) throw error;

            // Get the URL of the uploaded file
            const {data: urlData} = supabase.storage
                .from('files')
                .getPublicUrl(filePath);

            // Save metadata to the database
            await supabase.from('files').insert({
                name: file.name,
                path: filePath,
                size: file.size,
                mime_type: file.type,
                url: urlData?.publicUrl || '',
                created_at: new Date(),
            });

            alert('File uploaded successfully!');
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file. Please try again.');
        }
    };

    // Media categories display
    const MediaCategory = ({title, icon, count, size, usedPercentage, bgColor}:any) => (
        <div className="flex flex-col bg-white p-4 rounded-md shadow-sm">
            <div className={`flex items-center justify-center w-12 h-12 rounded-md mb-2 ${bgColor}`}>
                {icon}
            </div>
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-gray-600">{count} files</p>
            <div className="mt-1 flex justify-between items-center">
                <span className="text-gray-500">{usedPercentage} Used</span>
                <span className="font-medium">{formatGigaBytes(size)}</span>
            </div>
        </div>
    );

    // Folder display
    const FolderItem = ({name, fileCount, size}:any) => (
        <div className="relative bg-white p-4 rounded-md shadow-sm">
            <div className="absolute top-2 right-2">
                <button className="p-1 text-gray-500 hover:text-gray-700">
                    <MoreVertical size={16}/>
                </button>
            </div>
            <div className="mb-2">
                <Folder className="text-yellow-400" size={36}/>
            </div>
            <h3 className="text-lg font-medium">{name}</h3>
            <p className="text-gray-600">{fileCount} Files</p>
            <p className="text-right font-medium mt-2">{formatGigaBytes(size)}</p>
        </div>
    );

    // Calculate free space
    const freeSpace = totalStorage - usedStorage;

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Top navigation */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">File Manager</h1>
                        <div className="flex space-x-2">
                            <span className="text-gray-600">Home</span>
                            <span className="text-gray-600">›</span>
                            <span className="font-medium">File Manager</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="container mx-auto px-4 py-6">
                {/* All Media section */}
                <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">All Media</h2>
                        <div className="flex space-x-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            </div>
                            <label
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 cursor-pointer flex items-center">
                                <Upload size={18} className="mr-2"/>
                                <span>Upload File</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    //@ts-ignore
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MediaCategory
                            title="Image"
                            icon={<Image className="text-green-500" size={24}/>}
                            count={mediaFiles.images.count}
                            size={mediaFiles.images.size}
                            usedPercentage={calculatePercentage(mediaFiles.images.size, totalStorage)}
                            bgColor="bg-green-100"
                        />

                        <MediaCategory
                            title="Videos"
                            icon={<Video className="text-pink-500" size={24}/>}
                            count={mediaFiles.videos.count}
                            size={mediaFiles.videos.size}
                            usedPercentage={calculatePercentage(mediaFiles.videos.size, totalStorage)}
                            bgColor="bg-pink-100"
                        />

                        <MediaCategory
                            title="Audios"
                            icon={<Music className="text-blue-500" size={24}/>}
                            count={mediaFiles.audios.count}
                            size={mediaFiles.audios.size}
                            usedPercentage={calculatePercentage(mediaFiles.audios.size, totalStorage)}
                            bgColor="bg-blue-100"
                        />

                        <MediaCategory
                            title="Apps"
                            icon={<Grid className="text-orange-500" size={24}/>}
                            count={mediaFiles.apps.count}
                            size={mediaFiles.apps.size}
                            usedPercentage={calculatePercentage(mediaFiles.apps.size, totalStorage)}
                            bgColor="bg-orange-100"
                        />

                        <MediaCategory
                            title="Documents"
                            icon={<FileText className="text-yellow-500" size={24}/>}
                            count={mediaFiles.documents.count}
                            size={mediaFiles.documents.size}
                            usedPercentage={calculatePercentage(mediaFiles.documents.size, totalStorage)}
                            bgColor="bg-yellow-100"
                        />

                        <MediaCategory
                            title="Downloads"
                            icon={<Download className="text-purple-500" size={24}/>}
                            count={mediaFiles.downloads.count}
                            size={mediaFiles.downloads.size}
                            usedPercentage={calculatePercentage(mediaFiles.downloads.size, totalStorage)}
                            bgColor="bg-purple-100"
                        />
                    </div>
                </div>

                {/* Folders section */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">All Folders</h2>
                    <button className="text-blue-600 hover:text-blue-800 flex items-center">
                        View All
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {isLoading ? (
                        <div className="col-span-4 text-center py-12">Loading folders...</div>
                    ) : folders.length > 0 ? (
                        folders.map((folder) => (
                            <FolderItem
                                key={folder.id}
                                name={folder.name}
                                fileCount={folder.file_count || 0}
                                size={folder.total_size || 0}
                            />
                        ))
                    ) : (
                        <div className="col-span-4 text-center py-12 text-gray-500">
                            No folders found. Create a new folder to organize your files.
                        </div>
                    )}
                </div>

                {/* Storage Details */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Storage Details</h2>
                    <p className="text-gray-600 mb-4">{formatGigaBytes(freeSpace)} Free space left</p>

                    <div className="relative">
                        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div className="flex h-full">
                                <div
                                    className="h-full bg-green-500"
                                    style={{width: calculatePercentage(mediaFiles.images.size, totalStorage)}}
                                />
                                <div
                                    className="h-full bg-blue-500"
                                    style={{width: calculatePercentage(mediaFiles.audios.size, totalStorage)}}
                                />
                                <div
                                    className="h-full bg-yellow-500"
                                    style={{width: calculatePercentage(mediaFiles.documents.size, totalStorage)}}
                                />
                                <div
                                    className="h-full bg-orange-500"
                                    style={{width: calculatePercentage(mediaFiles.apps.size, totalStorage)}}
                                />
                                <div
                                    className="h-full bg-pink-500"
                                    style={{width: calculatePercentage(mediaFiles.videos.size, totalStorage)}}
                                />
                            </div>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white rounded-full p-6">
                                <div className="text-center">
                                    <p className="text-lg font-bold">Total {formatGigaBytes(totalStorage)}</p>
                                    <p className="text-gray-600">{formatGigaBytes(usedStorage)} used</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileManager;