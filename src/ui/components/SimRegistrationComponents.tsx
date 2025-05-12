import React, {useState} from 'react';
import {SIMCardCreate, SIMStatus} from '@/models';
import {useForm, Controller, FormProvider} from 'react-hook-form';
import {Button} from '@/ui/components/Button';
import {Input} from '@/ui/components/Input';
import {Label} from '@/ui/components/Label';
import {Select} from '@/ui/components/Select';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/ui/components/Card';
import {format} from 'date-fns';
import {toast} from '@/ui/components/Toast';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/ui/components/Tabs';
import {FileUpload} from './FileUpload';
import {Stepper} from "@/ui/components/Stepper";
import simService from "@/services/simService";
// import {Stepper, Step} from './Stepper';

// Component for basic SIM information
// @ts-ignore
const SimBasicInfo = ({control, errors}) => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="serial_number">SIM Serial Number*</Label>
                <Controller
                    name="serial_number"
                    control={control}
                    rules={{required: 'Serial number is required'}}
                    render={({field}) => (
                        <Input
                            id="serial_number"
                            placeholder="Enter SIM serial number"
                            {...field}
                            className={errors.serial_number ? 'border-red-500' : ''}
                        />
                    )}
                />
                {errors.serial_number && <p className="text-red-500 text-sm">{errors.serial_number.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="status">Status*</Label>
                <Controller
                    name="status"
                    control={control}
                    rules={{required: 'Status is required'}}
                    render={({field}) => (
                        <Select
                            id="status"
                            value={field.value}
                            //@ts-ignore
                            onValueChange={field.onChange}
                        >
                            <option value="">Select status</option>
                            <option value={SIMStatus.INACTIVE}>New</option>
                            <option value={SIMStatus.SOLD}>Sold</option>
                            <option value={SIMStatus.ACTIVATED}>Activated</option>
                            <option value={SIMStatus.PENDING}>Pending</option>
                            <option value={SIMStatus.FLAGGED}>Flagged</option>
                        </Select>
                    )}
                />
                {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="sale_date">Sale Date*</Label>
                <Controller
                    name="sale_date"
                    control={control}
                    rules={{required: 'Sale date is required'}}
                    render={({field}) => (
                        <Input
                            id="sale_date"
                            type="date"
                            {...field}
                            className={errors.sale_date ? 'border-red-500' : ''}
                        />
                    )}
                />
                {errors.sale_date && <p className="text-red-500 text-sm">{errors.sale_date.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="sale_location">Sale Location*</Label>
                <Controller
                    name="sale_location"
                    control={control}
                    rules={{required: 'Sale location is required'}}
                    render={({field}) => (
                        <Input
                            id="sale_location"
                            placeholder="Enter sale location"
                            {...field}
                            className={errors.sale_location ? 'border-red-500' : ''}
                        />
                    )}
                />
                {errors.sale_location && <p className="text-red-500 text-sm">{errors.sale_location.message}</p>}
            </div>
        </div>
    </div>
);

// Component for customer information
// @ts-ignore
const CustomerInfo = ({control, errors}) => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="customer_msisdn">Customer MSISDN*</Label>
                <Controller
                    name="customer_msisdn"
                    control={control}
                    rules={{
                        required: 'Customer phone number is required',
                        pattern: {
                            value: /^[0-9]{10,12}$/,
                            message: 'Please enter a valid phone number'
                        }
                    }}
                    render={({field}) => (
                        <Input
                            id="customer_msisdn"
                            placeholder="e.g., 254722XXXXXX"
                            {...field}
                            className={errors.customer_msisdn ? 'border-red-500' : ''}
                        />
                    )}
                />
                {errors.customer_msisdn && <p className="text-red-500 text-sm">{errors.customer_msisdn.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="customer_id_number">Customer ID Number*</Label>
                <Controller
                    name="customer_id_number"
                    control={control}
                    rules={{required: 'Customer ID number is required'}}
                    render={({field}) => (
                        <Input
                            id="customer_id_number"
                            placeholder="Enter customer ID number"
                            {...field}
                            className={errors.customer_id_number ? 'border-red-500' : ''}
                        />
                    )}
                />
                {errors.customer_id_number &&
                    <p className="text-red-500 text-sm">{errors.customer_id_number.message}</p>}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="customer_id_front">ID Front</Label>
                <Controller
                    name="customer_id_front_url"
                    control={control}
                    render={({field}) => (
                        <FileUpload
                            onChange={(url) => field.onChange(url)}
                            value={field.value}
                            acceptedFileTypes=".jpg,.jpeg,.png"
                            maxFileSizeMB={5}
                            label="Upload front ID photo"
                        />
                    )}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="customer_id_back">ID Back</Label>
                <Controller
                    name="customer_id_back_url"
                    control={control}
                    render={({field}) => (
                        <FileUpload
                            onChange={(url) => field.onChange(url)}
                            value={field.value}
                            acceptedFileTypes=".jpg,.jpeg,.png"
                            maxFileSizeMB={5}
                            label="Upload back ID photo"
                        />
                    )}
                />
            </div>
        </div>
    </div>
);

// Component for agent and team information
// @ts-ignore
const AgentInfo = ({control, errors, teams}) => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="agent_msisdn">Agent MSISDN*</Label>
                <Controller
                    name="agent_msisdn"
                    control={control}
                    rules={{
                        required: 'Agent phone number is required',
                        pattern: {
                            value: /^[0-9]{10,12}$/,
                            message: 'Please enter a valid phone number'
                        }
                    }}
                    render={({field}) => (
                        <Input
                            id="agent_msisdn"
                            placeholder="e.g., 254722XXXXXX"
                            {...field}
                            className={errors.agent_msisdn ? 'border-red-500' : ''}
                        />
                    )}
                />
                {errors.agent_msisdn && <p className="text-red-500 text-sm">{errors.agent_msisdn.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="team_id">Team*</Label>
                <Controller
                    name="team_id"
                    control={control}
                    rules={{required: 'Team is required'}}
                    render={({field}) => (
                        <Select
                            id="team_id"
                            value={field.value}
                            //@ts-ignore
                            onValueChange={field.onChange}
                        >
                            <option value="">Select team</option>

                            {
                                //@ts-ignore
                                teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                        </Select>
                    )}
                />
                {errors.team_id && <p className="text-red-500 text-sm">{errors.team_id.message}</p>}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="region">Region*</Label>
                <Controller
                    name="region"
                    control={control}
                    rules={{required: 'Region is required'}}
                    render={({field}) => (
                        <Input
                            id="region"
                            placeholder="Enter region"
                            {...field}
                            className={errors.region ? 'border-red-500' : ''}
                        />
                    )}
                />
                {errors.region && <p className="text-red-500 text-sm">{errors.region.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="top_up_amount">Initial Top-up Amount (Optional)</Label>
                <Controller
                    name="top_up_amount"
                    control={control}
                    render={({field}) => (
                        <Input
                            id="top_up_amount"
                            type="number"
                            placeholder="Enter top-up amount"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                    )}
                />
            </div>
        </div>
    </div>
);

// Main SIM Card Form Component with Steps
// @ts-ignore
export const SIMCardForm = ({teams, currentUser}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const methods = useForm<SIMCardCreate>({
        defaultValues: {
            serial_number: '',
            customer_msisdn: '',
            customer_id_number: '',
            agent_msisdn: '',
            sold_by_user_id: currentUser?.id || '',
            sale_date: format(new Date(), 'yyyy-MM-dd'),
            sale_location: '',
            team_id: currentUser?.team_id || '',
            region: '',
            status: SIMStatus.INACTIVE,
        }
    });

    const {control, handleSubmit, formState: {errors}} = methods;

    const steps = [
        {title: 'SIM Details', component: <SimBasicInfo control={control} errors={errors}/>},
        {title: 'Customer Info', component: <CustomerInfo control={control} errors={errors}/>},
        {title: 'Agent & Team', component: <AgentInfo control={control} errors={errors} teams={teams}/>},
    ];

    const onSubmit = async (data: SIMCardCreate) => {
        setIsSubmitting(true);
        try {
            const result = await simService.createSIMCard(data);
            if (result) {
                toast({
                    title: "Success",
                    description: "SIM card registered successfully",
                    variant: "success",
                });
                methods.reset();
                setActiveStep(0);
            } else {
                toast({
                    title: "Error",
                    description: "Failed to register SIM card",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = async () => {
        const fieldsToValidate = {
            0: ['serial_number', 'status', 'sale_date', 'sale_location'],
            1: ['customer_msisdn', 'customer_id_number'],
            2: ['agent_msisdn', 'team_id', 'region']
        }[activeStep];
//@ts-ignore
        const isValid = await methods.trigger(fieldsToValidate);

        if (isValid) {
            if (activeStep < steps.length - 1) {
                setActiveStep(activeStep + 1);
            } else {
                handleSubmit(onSubmit)();
            }
        }
    };

    const handlePrevious = () => {
        setActiveStep(Math.max(0, activeStep - 1));
    };

    return (
        <FormProvider {...methods}>
            <Card className="w-full border-green-500">
                <CardHeader>
                    <CardTitle>Register New SIM Card</CardTitle>
                    <CardDescription>Enter the SIM card details to register it in the system</CardDescription>
                </CardHeader>
                <CardContent>
                    <Stepper activeStep={activeStep} steps={steps.map(step => step.title)}/>

                    <div className="mt-6">
                        {steps[activeStep].component}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={activeStep === 0 || isSubmitting}
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                    >
                        {activeStep === steps.length - 1 ? (isSubmitting ? 'Submitting...' : 'Submit') : 'Next'}
                    </Button>
                </CardFooter>
            </Card>
        </FormProvider>
    );
};

// Additional components needed for the form (would be separately implemented)
export const BulkSIMCardUpload = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState<{
        total: number;
        success: number;
        failed: number;
        errors: string[];
    } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    const newProgress = prev + 10;
                    if (newProgress >= 100) {
                        clearInterval(progressInterval);
                        return 100;
                    }
                    return newProgress;
                });
            }, 500);

            // Mock API call to upload file
            // In real implementation, this would be a call to a backend service
            // that processes the CSV file and returns results
            setTimeout(() => {
                clearInterval(progressInterval);
                setUploadProgress(100);

                // Mock result
                setUploadResult({
                    total: 50,
                    success: 45,
                    failed: 5,
                    errors: [
                        "Row 12: Invalid SIM serial number",
                        "Row 23: Missing customer ID",
                        "Row 31: Duplicate SIM serial number",
                        "Row 42: Invalid region code",
                        "Row 47: Missing sale date"
                    ]
                });

                setIsUploading(false);
            }, 5000);
        } catch (error) {
            console.error('Error uploading file:', error);
            toast({
                title: "Error",
                description: "Failed to upload SIM cards data",
                variant: "destructive"
            });
            setIsUploading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Bulk SIM Card Upload</CardTitle>
                <CardDescription>
                    Upload a CSV file with SIM card data for bulk registration.
                    <a href="/templates/sim_upload_template.csv" className="text-blue-500 hover:underline ml-1">
                        Download template
                    </a>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center justify-center"
                        >
                            <div className="rounded-full bg-gray-100 p-3 mb-4">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M11 14.9861C11 15.5384 11.4477 15.9861 12 15.9861C12.5523 15.9861 13 15.5384 13 14.9861V7.82831L16.2428 11.0711C16.6333 11.4616 17.2665 11.4616 17.657 11.0711C18.0475 10.6806 18.0475 10.0474 17.657 9.65692L12.7071 4.70692C12.3166 4.3164 11.6834 4.3164 11.2929 4.70692L6.34292 9.65692C5.9524 10.0474 5.9524 10.6806 6.34292 11.0711C6.73345 11.4616 7.36661 11.4616 7.75714 11.0711L11 7.82831V14.9861Z"
                                        fill="currentColor"/>
                                    <path
                                        d="M4 14H6V18H18V14H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V14Z"
                                        fill="currentColor"/>
                                </svg>
                            </div>
                            <p className="text-sm font-medium mb-1">
                                {file ? file.name : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-xs text-gray-500">
                                CSV, Excel files up to 10MB
                            </p>
                        </label>
                    </div>

                    {file && !isUploading && !uploadResult && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                     xmlns="http://www.w3.org/2000/svg" className="text-gray-500 mr-2">
                                    <path d="M7 18H17V16H7V18Z" fill="currentColor"/>
                                    <path d="M17 14H7V12H17V14Z" fill="currentColor"/>
                                    <path d="M7 10H11V8H7V10Z" fill="currentColor"/>
                                    <path fillRule="evenodd" clipRule="evenodd"
                                          d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9C21 5.13401 17.866 2 14 2H6ZM6 4H13V9H19V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4ZM15 4.10002C16.6113 4.4271 17.9413 5.52906 18.584 7H15V4.10002Z"
                                          fill="currentColor"/>
                                </svg>
                                <span className="text-sm font-medium">{file.name}</span>
                            </div>
                            <Button onClick={handleUpload} className="text-sm">Upload</Button>
                        </div>
                    )}

                    {isUploading && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Uploading...</span>
                                <span className="text-sm text-gray-500">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{width: `${uploadProgress}%`}}
                                ></div>
                            </div>
                        </div>
                    )}

                    {uploadResult && (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h3 className="text-lg font-medium text-green-800">Upload Complete</h3>
                                <div className="mt-2 grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">Total Records</p>
                                        <p className="text-2xl font-bold">{uploadResult.total}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">Successful</p>
                                        <p className="text-2xl font-bold text-green-600">{uploadResult.success}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">Failed</p>
                                        <p className="text-2xl font-bold text-red-600">{uploadResult.failed}</p>
                                    </div>
                                </div>
                            </div>

                            {uploadResult.errors.length > 0 && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <h3 className="text-md font-medium text-red-800">Errors</h3>
                                    <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-red-700">
                                        {uploadResult.errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setFile(null);
                                        setUploadResult(null);
                                    }}
                                >
                                    Upload Another File
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// SIM Registration Container Component
// @ts-ignore
export const SIMRegistration = ({teams, currentUser}) => {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">SIM Card Registration</h1>

            <Tabs defaultValue="single">
                <TabsList className="mb-6">
                    <TabsTrigger value="single">Single Registration</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="single">
                    <SIMCardForm teams={teams} currentUser={currentUser}/>
                </TabsContent>

                <TabsContent value="bulk">
                    <BulkSIMCardUpload/>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Example of a Stepper component
