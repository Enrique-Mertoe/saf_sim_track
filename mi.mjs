import {createClient} from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'

// Source (Supabase Cloud) configuration
const SOURCE_SUPABASE_URL = 'https://aukjtuadtfpmlcfqusaa.supabase.co'
const SOURCE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1a2p0dWFkdGZwbWxjZnF1c2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTU2MzUsImV4cCI6MjA2MjEzMTYzNX0.P1Ki-tAg3a_Xvhw2GPiVNu7k5ynodtLnKEVRlKl1Dmg'

// Destination (Coolify Supabase) configuration
const DEST_SUPABASE_URL = 'https://supabasekong-wsg0o44oscw8so048ssogw4s.lomtechnology.com'
const DEST_SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NjIwOTM2MCwiZXhwIjo0OTExODgyOTYwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.ECCF-I9XdArQ0rvHuG4pnfcEwKiv5iJSLA8We6Dn7RI"

// Configuration for manual overrides (edit these values as needed)
const MANUAL_CONFIG = {
    // Set to null for auto-resume, or specify exact index numbers
    MANUAL_DOWNLOAD_START: null,  // e.g., 150 to start downloading from index 150
    MANUAL_UPLOAD_START: null,    // e.g., 50 to start uploading from index 50

    // Concurrent processing settings
    DOWNLOAD_CONCURRENT: 5,       // Number of simultaneous downloads (1-10 recommended)
    UPLOAD_CONCURRENT: 3,         // Number of simultaneous uploads (1-5 recommended)
}

// Create clients
const sourceSupabase = createClient(SOURCE_SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1a2p0dWFkdGZwbWxjZnF1c2FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU1NTYzNSwiZXhwIjoyMDYyMTMxNjM1fQ.t1rOaHPhHj-jouvON6kvsW3VQu61Rx3DpZu6-v_xNmA")
const destSupabase = createClient(DEST_SUPABASE_URL, DEST_SUPABASE_ANON_KEY)

// Create downloads directory
const DOWNLOAD_DIR = './storage_downloads'
const PROGRESS_FILE = './migration_progress.json'
const FILES_INDEX_FILE = './files_index.json'

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, {recursive: true})
}

// Progress management functions
function loadProgress() {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
            console.log('📚 Loaded existing progress:', progress)
            return progress
        }
    } catch (error) {
        console.log('⚠️ Error loading progress file, starting fresh:', error.message)
    }

    return {
        phase: 'init', // init, indexing, downloading, uploading, completed
        buckets: [],
        filesIndex: [],
        downloadProgress: {},
        uploadProgress: {},
        lastDownloadIndex: -1,
        lastUploadIndex: -1,
        startTime: new Date().toISOString(),
        lastSaveTime: new Date().toISOString()
    }
}

function saveProgress(progress) {
    try {
        progress.lastSaveTime = new Date().toISOString()
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
        console.log(`💾 Progress saved (${progress.phase})`)
    } catch (error) {
        console.error('❌ Error saving progress:', error)
    }
}

function loadFilesIndex() {
    try {
        if (fs.existsSync(FILES_INDEX_FILE)) {
            const filesIndex = JSON.parse(fs.readFileSync(FILES_INDEX_FILE, 'utf8'))
            console.log(`📋 Loaded files index: ${filesIndex.length} files`)
            return filesIndex
        }
    } catch (error) {
        console.log('⚠️ Error loading files index:', error.message)
    }
    return []
}

function saveFilesIndex(filesIndex) {
    try {
        fs.writeFileSync(FILES_INDEX_FILE, JSON.stringify(filesIndex, null, 2))
        console.log(`📋 Files index saved: ${filesIndex.length} files`)
    } catch (error) {
        console.error('❌ Error saving files index:', error)
    }
}

// Function to download file
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http
        const file = fs.createWriteStream(filepath)

        protocol.get(url, (response) => {
            response.pipe(file)
            file.on('finish', () => {
                file.close()
                resolve()
            })
        }).on('error', (err) => {
            fs.unlink(filepath, () => {
            }) // Delete the file on error
            reject(err)
        })
    })
}

// Function to get all buckets
async function getAllBuckets() {
    try {
        const {data: buckets, error} = await sourceSupabase.storage.listBuckets()
        if (error) throw error
        console.log('🪣 Found buckets:', buckets.map(b => b.name))
        return buckets
    } catch (error) {
        console.error('Error fetching buckets:', error)
        return []
    }
}

// Function to get all files in a bucket
async function getAllFilesInBucket(bucketName, folder = '') {
    try {
        const {data: files, error} = await sourceSupabase.storage
            .from(bucketName)
            .list(folder, {
                limit: 1000,
                sortBy: {column: 'name', order: 'asc'}
            })

        if (error) throw error

        let allFiles = []

        for (const file of files) {
            const filePath = folder ? `${folder}/${file.name}` : file.name

            if (file.id === null) {
                // This is a folder, recursively get files
                const subFiles = await getAllFilesInBucket(bucketName, filePath)
                allFiles = allFiles.concat(subFiles)
            } else {
                // This is a file
                allFiles.push({
                    name: file.name,
                    path: filePath,
                    bucket: bucketName,
                    size: file.metadata?.size || 0,
                    lastModified: file.updated_at
                })
            }
        }

        return allFiles
    } catch (error) {
        console.error(`Error fetching files from bucket ${bucketName}:`, error)
        return []
    }
}

// Function to build complete files index
async function buildFilesIndex(progress) {
    console.log('🔍 Building files index...')

    progress.phase = 'indexing'
    saveProgress(progress)

    // const buckets = await getAllBuckets()
    const buckets = [{name:'sim-management'}]
    progress.buckets = buckets

    if (buckets.length === 0) {
        console.log('No buckets found.')
        return []
    }

    let allFiles = []
    let fileIndex = 0

    for (const bucket of buckets) {
        console.log(`\n📁 Indexing bucket: ${bucket.name}`)

        // Get all files in bucket
        const files = await getAllFilesInBucket(bucket.name)
        console.log(`Found ${files.length} file(s) in bucket ${bucket.name}`)

        // Add index to each file
        files.forEach(file => {
            allFiles.push({
                ...file,
                index: fileIndex++,
                downloaded: false,
                uploaded: false
            })
        })
    }

    progress.filesIndex = allFiles
    saveProgress(progress)
    saveFilesIndex(allFiles)

    console.log(`📊 Total files indexed: ${allFiles.length}`)
    return allFiles
}

// Function to download a single file with retries
async function downloadSingleFile(file, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Create bucket directory
            const bucketDir = path.join(DOWNLOAD_DIR, file.bucket)
            if (!fs.existsSync(bucketDir)) {
                fs.mkdirSync(bucketDir, {recursive: true})
            }

            // Get signed URL for download
            const {data: signedUrlData} = await sourceSupabase.storage
                .from(file.bucket)
                .createSignedUrl(file.path, 60 * 60) // 1 hour expiry

            if (signedUrlData?.signedUrl) {
                const localFilePath = path.join(bucketDir, file.path)
                const localFileDir = path.dirname(localFilePath)

                // Create directory if it doesn't exist
                if (!fs.existsSync(localFileDir)) {
                    fs.mkdirSync(localFileDir, {recursive: true})
                }

                await downloadFile(signedUrlData.signedUrl, localFilePath)

                // Mark as downloaded
                file.downloaded = true
                file.localPath = localFilePath
                return {success: true, file}
            }

            throw new Error('No signed URL received')
        } catch (error) {
            if (attempt === maxRetries) {
                return {success: false, file, error: error.message}
            }
            console.log(`⚠️  Retry ${attempt}/${maxRetries} for ${file.path}: ${error.message}`)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
        }
    }
}

// Function to download files in parallel batches
async function downloadBatch(files, batchSize = 5) {
    const results = []

    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize)
        console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)} (${batch.length} files)`)

        const batchPromises = batch.map(file => downloadSingleFile(file))
        const batchResults = await Promise.all(batchPromises)

        // Log results for this batch
        batchResults.forEach((result, index) => {
            const globalIndex = i + index
            if (result.success) {
                console.log(`✅ [${globalIndex + 1}] Downloaded: ${result.file.path} (${formatBytes(result.file.size)})`)
            } else {
                console.error(`❌ [${globalIndex + 1}] Failed: ${result.file.path} - ${result.error}`)
            }
        })

        results.push(...batchResults)

        // Small delay between batches to prevent overwhelming the server
        if (i + batchSize < files.length) {
            await new Promise(resolve => setTimeout(resolve, 500))
        }
    }

    return results
}

// Function to download all files with checkpoint support and parallel processing
async function downloadAllFiles(progress, concurrent = 3, manualStartIndex = null) {
    console.log('📥 Starting download phase...')

    let filesIndex = progress.filesIndex

    // If no files index exists, build it
    if (!filesIndex || filesIndex.length === 0) {
        filesIndex = await buildFilesIndex(progress)
    }

    if (filesIndex.length === 0) {
        console.log('No files to download.')
        return []
    }

    progress.phase = 'downloading'
    saveProgress(progress)

    // Determine starting index (manual override or resume from checkpoint)
    let startIndex = 0
    if (manualStartIndex !== null) {
        startIndex = manualStartIndex
        console.log(`🎯 Manual start index specified: ${startIndex}`)
    } else {
        startIndex = Math.max(0, progress.lastDownloadIndex + 1)
        console.log(`🚀 Resuming from checkpoint: ${startIndex}`)
    }

    console.log(`📊 Download range: ${startIndex} to ${filesIndex.length - 1} (${filesIndex.length - startIndex} files)`)
    console.log(`⚡ Using ${concurrent} concurrent downloads`)

    // Filter files that need to be downloaded
    const filesToDownload = []
    for (let i = startIndex; i < filesIndex.length; i++) {
        const file = filesIndex[i]
        if (!file.downloaded) {
            file.globalIndex = i // Keep track of original index
            filesToDownload.push(file)
        }
    }

    if (filesToDownload.length === 0) {
        console.log('✅ All files already downloaded!')
        return filesIndex.filter(f => f.downloaded)
    }

    console.log(`📥 Files to download: ${filesToDownload.length}`)

    // Download in parallel batches
    const results = await downloadBatch(filesToDownload, concurrent)

    // Update progress and save periodically
    let successCount = 0
    let lastSavedIndex = startIndex - 1

    results.forEach(result => {
        if (result.success) {
            successCount++
            const globalIndex = result.file.globalIndex

            // Update the original files index
            filesIndex[globalIndex] = result.file

            // Save progress every 10 successful downloads
            if (successCount % 10 === 0 || globalIndex === filesIndex.length - 1) {
                progress.lastDownloadIndex = globalIndex
                progress.filesIndex = filesIndex
                saveProgress(progress)
                saveFilesIndex(filesIndex)
                lastSavedIndex = globalIndex
            }
        }
    })

    // Final save if we haven't saved the last index
    if (lastSavedIndex < filesIndex.length - 1) {
        progress.lastDownloadIndex = filesIndex.length - 1
        progress.filesIndex = filesIndex
        saveProgress(progress)
        saveFilesIndex(filesIndex)
    }

    const failedCount = results.length - successCount
    console.log(`📥 Download phase completed: ${successCount} successful, ${failedCount} failed`)

    if (failedCount > 0) {
        console.log('⚠️  Failed files:')
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.file.path}: ${r.error}`)
        })
    }

    return filesIndex.filter(f => f.downloaded)
}

// Function to create bucket in destination
async function createBucket(bucketName, isPublic = false) {
    try {
        const {data, error} = await destSupabase.storage.createBucket(bucketName, {
            public: isPublic,
            fileSizeLimit: null,
            allowedMimeTypes: null
        })

        if (error && !error.message.includes('already exists')) {
            throw error
        }

        console.log(`✅ Bucket "${bucketName}" ready`)
        return true
    } catch (error) {
        console.error(`❌ Error creating bucket ${bucketName}:`, error)
        return false
    }
}

// Function to upload a single file with retries
async function uploadSingleFile(file, maxRetries = 3) {
    file.localPath = DOWNLOAD_DIR + "/" + file.bucket + "/" + file.path
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {

            // Check if local file exists
            if (!fs.existsSync(file.localPath)) {
                throw new Error(`Local file not found: ${file.localPath}`)
            }

            const fileBuffer = fs.readFileSync(file.localPath)

            const {data, error} = await destSupabase.storage
                .from(file.bucket)

                .upload(file.path, fileBuffer, {
                    upsert: true
                })

            console.log("eee", error)
            console.log("ddd", data)

            if (error) {
                throw error
            }

            // Mark as uploaded
            file.uploaded = true
            return {success: true, file}

        } catch (error) {
            if (attempt === maxRetries) {
                return {success: false, file, error: error.message}
            }
            console.log(`⚠️  Retry ${attempt}/${maxRetries} for upload ${file.path}: ${error.message}`)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
        }
    }
}

// Function to upload files in parallel batches
async function uploadBatch(files, batchSize = 3) {
    const results = []

    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize)
        console.log(`🔄 Processing upload batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)} (${batch.length} files)`)

        const batchPromises = batch.map(file => uploadSingleFile(file))
       const batchResults = await  Promise.all(batchPromises)

        // // Log results for this batch
        batchResults.forEach((result, index) => {
            const globalIndex = i + index
            if (result.success) {
                console.log(`✅ [${globalIndex + 1}] Uploaded: ${result.file.path} (${formatBytes(result.file.size)})`)
            } else {
                console.error(`❌ [${globalIndex + 1}] Failed: ${result.file.path} - ${result.error}`)
            }
        })

        results.push(...batchResults)

        // Small delay between batches
        if (i + batchSize < files.length) {
            await new Promise(resolve => setTimeout(resolve, 300))
        }
    }

    return results
}

// Function to upload files with checkpoint support and parallel processing
async function uploadAllFiles(progress, concurrent = 3, manualStartIndex = null) {
    console.log('\n📤 Starting upload phase...')

    let filesIndex = progress.filesIndex || loadFilesIndex()

    // console.log("h=",filesIndex[0])

    if (!filesIndex || filesIndex.length === 0) {
        console.log('No files index found. Please run download first.')
        return
    }

    progress.phase = 'uploading'
    saveProgress(progress)

    // Filter only downloaded files
    // const downloadedFiles = filesIndex.filter(file => file.downloaded && file.localPath)
    const downloadedFiles = filesIndex

    if (downloadedFiles.length === 0) {
        console.log('No downloaded files found for upload.')
        return
    }

    // Create buckets first
    const buckets = [...new Set(downloadedFiles.map(file => file.bucket))]
    for (const bucketName of buckets) {
        console.log(`📁 Creating/checking bucket: ${bucketName}`)
        await createBucket(bucketName)
    }

    // Determine starting index for upload (manual override or resume from checkpoint)
    let startIndex = 0
    if (manualStartIndex !== null) {
        startIndex = manualStartIndex
        console.log(`🎯 Manual upload start index specified: ${startIndex}`)
    } else {
        startIndex = Math.max(0, progress.lastUploadIndex + 1)
        console.log(`🚀 Resuming upload from checkpoint: ${startIndex}`)
    }

    console.log(`📊 Upload range: ${startIndex} to ${downloadedFiles.length - 1} (${downloadedFiles.length - startIndex} files)`)
    console.log(`⚡ Using ${concurrent} concurrent uploads`)

    // Filter files that need to be uploaded
    const filesToUpload = []
    for (let i = startIndex; i < downloadedFiles.length; i++) {
        const file = downloadedFiles[i]
        if (!file.uploaded) {
            file.uploadIndex = i // Keep track of upload index
            filesToUpload.push(file)
        }
    }

    if (filesToUpload.length === 0) {
        console.log('✅ All files already uploaded!')
        return
    }

    console.log(`📤 Files to upload: ${filesToUpload.length}`)

    // Upload in parallel batches
    const results = await uploadBatch(filesToUpload, concurrent)

    // Update progress and save periodically
    let successCount = 0
    let lastSavedIndex = startIndex - 1

    results.forEach(result => {
        if (result.success) {
            successCount++
            const uploadIndex = result.file.uploadIndex

            // Update the original files index
            const originalFile = filesIndex.find(f => f.path === result.file.path && f.bucket === result.file.bucket)
            if (originalFile) {
                originalFile.uploaded = true
            }

            // Save progress every 5 successful uploads
            if (successCount % 5 === 0 || uploadIndex === downloadedFiles.length - 1) {
                progress.lastUploadIndex = uploadIndex
                progress.filesIndex = filesIndex
                saveProgress(progress)
                saveFilesIndex(filesIndex)
                lastSavedIndex = uploadIndex
            }
        }
    })

    // Final save if we haven't saved the last index
    if (lastSavedIndex < downloadedFiles.length - 1) {
        progress.lastUploadIndex = downloadedFiles.length - 1
        progress.phase = 'completed'
        progress.filesIndex = filesIndex
        saveProgress(progress)
        saveFilesIndex(filesIndex)
    }

    const failedCount = results.length - successCount
    console.log(`📤 Upload phase completed: ${successCount} successful, ${failedCount} failed`)

    if (failedCount > 0) {
        console.log('⚠️  Failed uploads:')
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.file.path}: ${r.error}`)
        })
    }
}

// Utility function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Function to show current status
function showStatus(progress) {
    console.log('\n📊 Current Migration Status:')
    console.log(`Phase: ${progress.phase}`)
    console.log(`Buckets: ${progress.buckets?.length || 0}`)
    console.log(`Total files: ${progress.filesIndex?.length || 0}`)

    if (progress.filesIndex && progress.filesIndex.length > 0) {
        const downloaded = progress.filesIndex.filter(f => f.downloaded).length
        const uploaded = progress.filesIndex.filter(f => f.uploaded).length

        console.log(`Downloaded: ${downloaded}/${progress.filesIndex.length} (${((downloaded / progress.filesIndex.length) * 100).toFixed(1)}%)`)
        console.log(`Uploaded: ${uploaded}/${progress.filesIndex.length} (${((uploaded / progress.filesIndex.length) * 100).toFixed(1)}%)`)
    }

    console.log(`Last download index: ${progress.lastDownloadIndex}`)
    console.log(`Last upload index: ${progress.lastUploadIndex}`)
    console.log(`Started: ${progress.startTime}`)
    console.log(`Last saved: ${progress.lastSaveTime}`)
}

// Main migration function with resume capability
async function migrateStorage(command = 'migrate') {
    try {
        console.log('🚀 Starting Supabase Storage Migration with Checkpoints...')
        console.log('Source:', SOURCE_SUPABASE_URL)
        console.log('Destination:', DEST_SUPABASE_URL)

        const progress = loadProgress()

        if (command === 'status') {
            showStatus(progress)
            return
        }

        if (command === 'reset') {
            console.log('🔄 Resetting migration progress...')
            if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE)
            if (fs.existsSync(FILES_INDEX_FILE)) fs.unlinkSync(FILES_INDEX_FILE)
            console.log('✅ Progress reset complete')
            return
        }

        if (command === 'download' || command === 'migrate') {
            await downloadAllFiles(progress, MANUAL_CONFIG.DOWNLOAD_CONCURRENT, MANUAL_CONFIG.MANUAL_DOWNLOAD_START)
        }

        if (command === 'upload' || command === 'migrate') {
            await uploadAllFiles(progress, MANUAL_CONFIG.UPLOAD_CONCURRENT, MANUAL_CONFIG.MANUAL_UPLOAD_START)
        }

        if (progress.phase === 'completed') {
            console.log('\n🎉 Migration completed!')
            console.log('💡 You can now delete the storage_downloads folder if everything looks good.')
            console.log('💡 Use "node script.js clean" to remove checkpoint files.')
        }

    } catch (error) {
        console.error('❌ Migration failed:', error)
        console.log('💡 You can resume by running the script again.')
    }
}

// Handle command line arguments
const command = process.argv[2] || 'migrate'

if (command === 'clean') {
    console.log('🧹 Cleaning up checkpoint files...')
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            fs.unlinkSync(PROGRESS_FILE)
            console.log('✅ Removed progress file')
        }
        if (fs.existsSync(FILES_INDEX_FILE)) {
            fs.unlinkSync(FILES_INDEX_FILE)
            console.log('✅ Removed files index')
        }
        console.log('🎉 Cleanup complete!')
    } catch (error) {
        console.error('❌ Error during cleanup:', error)
    }
} else {
    // Show available commands
    if (command === 'help') {
        console.log('\n📖 Available commands:')
        console.log('  node script.js migrate    - Run full migration (default)')
        console.log('  node script.js download   - Only download files')
        console.log('  node script.js upload     - Only upload files')
        console.log('  node script.js status     - Show current status')
        console.log('  node script.js reset      - Reset progress (start over)')
        console.log('  node script.js clean      - Remove checkpoint files')
        console.log('  node script.js help       - Show this help')
        console.log('')
        console.log('🔧 Configuration (edit MANUAL_CONFIG at top of script):')
        console.log(`  Download concurrent: ${MANUAL_CONFIG.DOWNLOAD_CONCURRENT} files`)
        console.log(`  Upload concurrent: ${MANUAL_CONFIG.UPLOAD_CONCURRENT} files`)
        console.log(`  Manual download start: ${MANUAL_CONFIG.MANUAL_DOWNLOAD_START || 'auto-resume'}`)
        console.log(`  Manual upload start: ${MANUAL_CONFIG.MANUAL_UPLOAD_START || 'auto-resume'}`)
        console.log('')
    } else {
        migrateStorage(command)
    }
}