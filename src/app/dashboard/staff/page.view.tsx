"use client"
import {ChangeEvent, useRef, useState} from "react";
import {ArrowLeft, Check, Info, Upload, UserPlus, X} from "lucide-react";
import {onboardingService, storageService} from "@/services";
import {generateUUID} from "@/helper";
import {User, UserRole} from "@/models";
import Signal from "@/lib/Signal";

export default function OnboardStaff({user, onClose}: {
    user: User, onClose: Closure
}) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const idFrontRef = useRef(null);
    const idBackRef = useRef(null);

    const [formData, setFormData] = useState({
        fullName: "",
        idNumber: "",
        phoneNumber: "",
        email: "",
        mobigoNumber: "",
        staffRole: "van_ba", // Default role
        idFrontImage: null,
        idBackImage: null,
        idFrontImageURL: null,
        idBackImageURL: null
    });


    const handleChange = (e: any) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>, type: string) => {
        // @ts-ignore
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size should be less than 5MB");
            return;
        }

        // Check file type
        if (!file.type.includes("image/")) {
            setError("Please upload an image file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {

            setFormData({
                ...formData,
                [type]: file,
                // @ts-ignore
                [`${type}URL`]: event.target.result
            });
        };
        reader.readAsDataURL(file);
        setError("");
    };

    const validateStep1 = () => {
        if (!formData.fullName || !formData.idNumber || !formData.phoneNumber || !formData.email) {
            setError("Please fill in all required fields");
            return false;
        }

        // Validate phone number format
        const phoneRegex = /^[0-9]{9,12}$/;
        if (!phoneRegex.test(formData.phoneNumber)) {
            setError("Please enter a valid phone number");
            return false;
        }

        // Validate ID number format
        const idRegex = /^[0-9]{7,10}$/;
        if (!idRegex.test(formData.idNumber)) {
            setError("Please enter a valid ID number");
            return false;
        }

        setError("");
        return true;
    };

    const validateStep2 = () => {
        if (!formData.idFrontImage || !formData.idBackImage) {
            setError("Please upload both front and back ID images");
            return false;
        }

        setError("");
        return true;
    };

    const handleNextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    const handlePrevStep = () => {
        if (step > 1) {
            setStep(step - 1);
            setError("");
        }
    };

    const handleSubmit = async (e: any) => {
        if (step !== 3)
            return
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const key =
                `team-${generateUUID()}-${formData.idNumber}${Date.now()}`
            const {url: idFrontURL} = await storageService.uploadIdFrontImage(
                key,
                formData.idFrontImage as unknown as File,
            );

            const {url: idBackURL} = await storageService.uploadIdBackImage(
                key,
                formData.idBackImage as unknown as File,
            );

            const {error} = await onboardingService.createRequest({
                full_name: formData.fullName,
                email: formData.email,
                id_back_url: idBackURL!,
                id_front_url: idFrontURL!,
                id_number: formData.idNumber,
                phone_number: formData.phoneNumber,
                request_type: "ONBOARDING",
                requested_by_id: user?.id ?? '',
                team_id: user?.team_id,
                role: UserRole.STAFF

            })
            if (error)
                throw error
            // await addDoc(collection(db, "staffRequests"), {
            //     staffName: formData.fullName,
            //     staffIdNumber: formData.idNumber,
            //     staffPhone: formData.phoneNumber,
            //     staffMobigoNumber: formData.mobigoNumber,
            //     staffRole: formData.staffRole,
            //     idFrontImageURL: idFrontURL,
            //     idBackImageURL: idBackURL,
            //     teamLeaderId: user.id,
            //     teamLeaderName: user.fullName,
            //     teamId: user.teamId || null,
            //     requestedAt: new Date().toISOString(),
            //     status: "pending"
            // });

            setSuccess(true);
            resetForm();
            Signal.trigger("fetchOnboard")
        } catch (error) {
            console.error("Error submitting staff request:", error);
            setError("Failed to submit request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: "",
            idNumber: "",
            phoneNumber: "",
            email: "",
            mobigoNumber: "",
            staffRole: "van_ba",
            idFrontImage: null,
            idBackImage: null,
            idFrontImageURL: null,
            idBackImageURL: null
        });
        setStep(1);
    };

    const handleNewRequest = () => {
        setSuccess(false);
        resetForm();
    };

    const renderStep1 = () => (

        <div className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium dark:text-gray-300 text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                </label>
                <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter staff full name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone number <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="text"
                        placeholder="Enter phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="idNumber" className="block text-sm dark:text-gray-300 font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter email address"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="idNumber" className="block text-sm font-medium dark:text-gray-300 text-gray-700">
                        ID Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="idNumber"
                        name="idNumber"
                        type="number"
                        placeholder="Enter national ID number"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
                        value={formData.idNumber}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        ID Front <span className="text-red-500">*</span>
                    </label>

                    {formData.idFrontImageURL ? (
                        <div className="relative">
                            <img
                                src={formData.idFrontImageURL}
                                alt="ID Front Preview"
                                className="w-full h-48 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                                onClick={() => setFormData({...formData, idFrontImage: null, idFrontImageURL: null})}
                                className="absolute top-2 right-2 bg-red-100 p-1 rounded-full text-red-600 hover:bg-red-200"
                            >
                                <X size={16}/>
                            </button>
                        </div>
                    ) : (
                        <div
                            //@ts-ignore
                            onClick={() => idFrontRef.current.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50"
                        >
                            <Upload size={24} className="text-gray-400 mb-2"/>
                            <p className="text-sm text-gray-500">Click to upload ID front</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF under 5MB</p>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={idFrontRef}
                        className="hidden"
                        accept="image/*"
                        onChange={e => handleImageChange(e, 'idFrontImage')}
                    />
                </div>

                <div className="flex-1 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        ID Back <span className="text-red-500">*</span>
                    </label>

                    {formData.idBackImageURL ? (
                        <div className="relative">
                            <img
                                src={formData.idBackImageURL}
                                alt="ID Back Preview"
                                className="w-full h-48 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                                onClick={() => setFormData({...formData, idBackImage: null, idBackImageURL: null})}
                                className="absolute top-2 right-2 bg-red-100 p-1 rounded-full text-red-600 hover:bg-red-200"
                            >
                                <X size={16}/>
                            </button>
                        </div>
                    ) : (
                        <div
                            //@ts-ignore
                            onClick={() => idBackRef.current.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 dark:bg-gray-800"
                        >
                            <Upload size={24} className="text-gray-400 mb-2"/>
                            <p className="text-sm text-gray-500">Click to upload ID back</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF under 5MB</p>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={idBackRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'idBackImage')}
                    />
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3">
                <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5"/>
                <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">ID Document Guidelines:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Make sure the ID is not expired</li>
                        <li>All four corners of the ID must be visible</li>
                        <li>Information must be clearly readable</li>
                        <li>No glare or shadows on the ID</li>
                    </ul>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Review Staff Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium dark:text-gray-100">{formData.fullName}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">ID Number</p>
                        <p className="font-medium">{formData.idNumber}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="font-medium">{formData.phoneNumber}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Mobigo Number</p>
                        <p className="font-medium">{formData.mobigoNumber || 'Not provided'}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Staff Role</p>
                        <p className="font-medium">{formData.staffRole}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Team Leader</p>
                        <p className="font-medium">{user?.full_name || 'Current user'}</p>
                    </div>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-4">
                    <h4 className="text-md font-medium text-gray-700 mb-3">ID Documents</h4>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-2">ID Front</p>
                            <img
                                //@ts-ignore
                                src={formData.idFrontImageURL}
                                alt="ID Front"
                                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-2">ID Back</p>
                            <img
                                //@ts-ignore
                                src={formData.idBackImageURL}
                                alt="ID Back"
                                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg flex items-start space-x-3">
                <Info size={20} className="text-yellow-600 flex-shrink-0 mt-0.5"/>
                <div className="text-sm text-yellow-700 dark:text-yellow-400">
                    <p>Your request will be sent to an administrator for approval. You`ll be notified once the request
                        is approved or rejected.</p>
                </div>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div className="text-center py-8">
            <div
                className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600"/>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Staff Onboarding Request Submitted</h3>
            <p className="text-gray-500 mb-6">
                Your request to onboard {formData.fullName} has been submitted successfully. An administrator will
                review it shortly.
            </p>
            <button
                onClick={handleNewRequest}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
                Submit Another Request
            </button>
        </div>
    );

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                    <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            step >= s ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                    >
                        {s}
                    </div>
                    {s < 3 && (
                        <div
                            className={`w-12 h-1 ${
                                step > s ? "bg-green-600" : "bg-gray-200"
                            }`}
                        ></div>
                    )}
                </div>
            ))}
        </div>
    );

    return (

        <div className="mx-auto minh-h-full w-full pt-4 dark:bg-gray-800">

            <div className="flex items-center px-4 justify-between mb-6">
                <div className="w-10"></div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <UserPlus size={24} className="mr-2 text-green-600"/>
                    Onboard Staff
                </h1>
                <a href=""
                onClick={(e) => {
                    e.preventDefault()
                    onClose?.()
                }}
                >
                    <button
                        className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <X size={16} className="text-gray-600 dark:text-gray-300"/>
                    </button>
                </a>
            </div>

            <div
                className={"border-t border-gray-200 dark:border-t-gray-700 p-6 s"}>
                {success ? (
                    renderSuccess()
                ) : (
                    <form onSubmit={handleSubmit}>
                        {renderStepIndicator()}

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}

                        <div className="mt-8 flex justify-between">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    <ArrowLeft size={16} className="mr-2"/>
                                    Previous
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="inline-flex items-center px-6 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Submitting..." : "Submit Request"}
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}