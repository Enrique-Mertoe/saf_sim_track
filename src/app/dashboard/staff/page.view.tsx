// "use client"
// import {ChangeEvent, useRef, useState} from "react";
// import {ArrowLeft, Check, Info, Upload, UserPlus, X} from "lucide-react";
// import {onboardingService, storageService} from "@/services";
// import {generateUUID} from "@/helper";
// import {User, UserRole} from "@/models";
// import Signal from "@/lib/Signal";
//
// export default function OnboardStaff({user, onClose}: {
//     user: User, onClose: Closure
// }) {
//     const [step, setStep] = useState(1);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [success, setSuccess] = useState(false);
//     const idFrontRef = useRef(null);
//     const idBackRef = useRef(null);
//
//     const [formData, setFormData] = useState({
//         fullName: "",
//         idNumber: "",
//         phoneNumber: "",
//         email: "",
//         mobigoNumber: "",
//         staffRole: "van_ba",
//         idFrontImage: null,
//         idBackImage: null,
//         idFrontImageURL: null,
//         idBackImageURL: null
//     });
//
//     const handleChange = (e: any) => {
//         const {name, value} = e.target;
//         setFormData({
//             ...formData,
//             [name]: value
//         });
//     };
//
//     const handleImageChange = (e: ChangeEvent<HTMLInputElement>, type: string) => {
//         // @ts-ignore
//         const file = e.target.files[0];
//         if (!file) return;
//
//         if (file.size > 5 * 1024 * 1024) {
//             setError("Image size should be less than 5MB");
//             return;
//         }
//
//         if (!file.type.includes("image/")) {
//             setError("Please upload an image file");
//             return;
//         }
//
//         const reader = new FileReader();
//         reader.onload = (event) => {
//             setFormData({
//                 ...formData,
//                 [type]: file,
//                 // @ts-ignore
//                 [`${type}URL`]: event.target.result
//             });
//         };
//         reader.readAsDataURL(file);
//         setError("");
//     };
//
//     const validateStep1 = () => {
//         if (!formData.fullName || !formData.idNumber || !formData.phoneNumber || !formData.email) {
//             setError("Please fill in all required fields");
//             return false;
//         }
//
//         const phoneRegex = /^[0-9]{9,12}$/;
//         if (!phoneRegex.test(formData.phoneNumber)) {
//             setError("Please enter a valid phone number");
//             return false;
//         }
//
//         const idRegex = /^[0-9]{7,10}$/;
//         if (!idRegex.test(formData.idNumber)) {
//             setError("Please enter a valid ID number");
//             return false;
//         }
//
//         setError("");
//         return true;
//     };
//
//     const validateStep2 = () => {
//         if (!formData.idFrontImage || !formData.idBackImage) {
//             setError("Please upload both front and back ID images");
//             return false;
//         }
//         setError("");
//         return true;
//     };
//
//     const handleNextStep = () => {
//         if (step === 1 && validateStep1()) {
//             setStep(2);
//         } else if (step === 2 && validateStep2()) {
//             setStep(3);
//         }
//     };
//
//     const handlePrevStep = () => {
//         if (step > 1) {
//             setStep(step - 1);
//             setError("");
//         }
//     };
//
//     const handleSubmit = async (e: any) => {
//         if (step !== 3) return;
//         e.preventDefault();
//
//         try {
//             setLoading(true);
//             setError("");
//
//             const key = `team-${generateUUID()}-${formData.idNumber}${Date.now()}`;
//             const {url: idFrontURL} = await storageService.uploadIdFrontImage(
//                 key,
//                 formData.idFrontImage as unknown as File,
//             );
//
//             const {url: idBackURL} = await storageService.uploadIdBackImage(
//                 key,
//                 formData.idBackImage as unknown as File,
//             );
//
//             const {error} = await onboardingService.createRequest({
//                 full_name: formData.fullName,
//                 email: formData.email,
//                 id_back_url: idBackURL!,
//                 id_front_url: idFrontURL!,
//                 id_number: formData.idNumber,
//                 phone_number: formData.phoneNumber,
//                 request_type: "ONBOARDING",
//                 requested_by_id: user?.id ?? '',
//                 team_id: user?.team_id,
//                 role: UserRole.STAFF
//             });
//
//             if (error) throw error;
//
//             setSuccess(true);
//             resetForm();
//             Signal.trigger("fetchOnboard");
//         } catch (error) {
//             console.error("Error submitting staff request:", error);
//             setError("Failed to submit request. Please try again.");
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const resetForm = () => {
//         setFormData({
//             fullName: "",
//             idNumber: "",
//             phoneNumber: "",
//             email: "",
//             mobigoNumber: "",
//             staffRole: "van_ba",
//             idFrontImage: null,
//             idBackImage: null,
//             idFrontImageURL: null,
//             idBackImageURL: null
//         });
//         setStep(1);
//     };
//
//     const handleNewRequest = () => {
//         setSuccess(false);
//         resetForm();
//     };
//
//     const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100";
//
//     const renderStep1 = () => (
//         <div className="space-y-4">
//             <div>
//                 <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Full Name <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                     name="fullName"
//                     type="text"
//                     placeholder="Enter full name"
//                     className={inputClass}
//                     value={formData.fullName}
//                     onChange={handleChange}
//                     required
//                 />
//             </div>
//
//             <div className="grid grid-cols-2 gap-3">
//                 <div>
//                     <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
//                         Phone <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                         name="phoneNumber"
//                         type="text"
//                         placeholder="Phone number"
//                         className={inputClass}
//                         value={formData.phoneNumber}
//                         onChange={handleChange}
//                         required
//                     />
//                 </div>
//                 <div>
//                     <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
//                         Email <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                         name="email"
//                         type="email"
//                         placeholder="Email address"
//                         className={inputClass}
//                         value={formData.email}
//                         onChange={handleChange}
//                         required
//                     />
//                 </div>
//             </div>
//
//             <div className="grid grid-cols-2 gap-3">
//                 <div>
//                     <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
//                         ID Number <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                         name="idNumber"
//                         type="text"
//                         placeholder="National ID"
//                         className={inputClass}
//                         value={formData.idNumber}
//                         onChange={handleChange}
//                         required
//                     />
//                 </div>
//                 <div>
//                     <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
//                         Mobigo Number
//                     </label>
//                     <input
//                         name="mobigoNumber"
//                         type="text"
//                         placeholder="Mobigo number"
//                         className={inputClass}
//                         value={formData.mobigoNumber}
//                         onChange={handleChange}
//                     />
//                 </div>
//             </div>
//
//             <div>
//                 <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Staff Role
//                 </label>
//                 <select
//                     name="staffRole"
//                     className={inputClass}
//                     value={formData.staffRole}
//                     onChange={handleChange}
//                 >
//                     <option value="van_ba">Van BA</option>
//                     <option value="driver">Driver</option>
//                     <option value="assistant">Assistant</option>
//                 </select>
//             </div>
//         </div>
//     );
//
//     const renderStep2 = () => (
//         <div className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//                 <div>
//                     <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         ID Front <span className="text-red-500">*</span>
//                     </label>
//                     {formData.idFrontImageURL ? (
//                         <div className="relative">
//                             <img
//                                 src={formData.idFrontImageURL}
//                                 alt="ID Front"
//                                 className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
//                             />
//                             <button
//                                 onClick={() => setFormData({...formData, idFrontImage: null, idFrontImageURL: null})}
//                                 className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
//                             >
//                                 <X size={12}/>
//                             </button>
//                         </div>
//                     ) : (
//                         <div
//                             //@ts-ignore
//                             onClick={() => idFrontRef.current.click()}
//                             className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
//                         >
//                             <Upload size={16} className="text-gray-400 mb-1"/>
//                             <p className="text-xs text-gray-500">Upload ID Front</p>
//                         </div>
//                     )}
//                     <input
//                         type="file"
//                         ref={idFrontRef}
//                         className="hidden"
//                         accept="image/*"
//                         onChange={e => handleImageChange(e, 'idFrontImage')}
//                     />
//                 </div>
//
//                 <div>
//                     <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         ID Back <span className="text-red-500">*</span>
//                     </label>
//                     {formData.idBackImageURL ? (
//                         <div className="relative">
//                             <img
//                                 src={formData.idBackImageURL}
//                                 alt="ID Back"
//                                 className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
//                             />
//                             <button
//                                 onClick={() => setFormData({...formData, idBackImage: null, idBackImageURL: null})}
//                                 className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
//                             >
//                                 <X size={12}/>
//                             </button>
//                         </div>
//                     ) : (
//                         <div
//                             //@ts-ignore
//                             onClick={() => idBackRef.current.click()}
//                             className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
//                         >
//                             <Upload size={16} className="text-gray-400 mb-1"/>
//                             <p className="text-xs text-gray-500">Upload ID Back</p>
//                         </div>
//                     )}
//                     <input
//                         type="file"
//                         ref={idBackRef}
//                         className="hidden"
//                         accept="image/*"
//                         onChange={(e) => handleImageChange(e, 'idBackImage')}
//                     />
//                 </div>
//             </div>
//
//             <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
//                 <div className="flex items-start space-x-2">
//                     <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5"/>
//                     <div className="text-xs text-blue-700 dark:text-blue-300">
//                         <p className="font-medium mb-1">Guidelines:</p>
//                         <ul className="list-disc pl-4 space-y-0.5">
//                             <li>ID not expired</li>
//                             <li>All corners visible</li>
//                             <li>Text clearly readable</li>
//                             <li>No glare or shadows</li>
//                         </ul>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
//
//     const renderStep3 = () => (
//         <div className="space-y-4">
//             <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
//                 <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Review Information</h3>
//
//                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
//                     <div>
//                         <p className="text-gray-500">Name</p>
//                         <p className="font-medium dark:text-gray-100">{formData.fullName}</p>
//                     </div>
//                     <div>
//                         <p className="text-gray-500">ID Number</p>
//                         <p className="font-medium dark:text-gray-100">{formData.idNumber}</p>
//                     </div>
//                     <div>
//                         <p className="text-gray-500">Phone</p>
//                         <p className="font-medium dark:text-gray-100">{formData.phoneNumber}</p>
//                     </div>
//                     <div>
//                         <p className="text-gray-500">Email</p>
//                         <p className="font-medium dark:text-gray-100">{formData.email}</p>
//                     </div>
//                     <div>
//                         <p className="text-gray-500">Role</p>
//                         <p className="font-medium dark:text-gray-100 capitalize">{formData.staffRole.replace('_', ' ')}</p>
//                     </div>
//                     <div>
//                         <p className="text-gray-500">Team Leader</p>
//                         <p className="font-medium dark:text-gray-100">{user?.full_name || 'Current user'}</p>
//                     </div>
//                 </div>
//
//                 <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
//                     <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">ID Documents</p>
//                     <div className="grid grid-cols-2 gap-2">
//                         <div>
//                             <p className="text-xs text-gray-500 mb-1">Front</p>
//                             <img
//                                 //@ts-ignore
//                                 src={formData.idFrontImageURL}
//                                 alt="ID Front"
//                                 className="w-full h-20 object-cover rounded border"
//                             />
//                         </div>
//                         <div>
//                             <p className="text-xs text-gray-500 mb-1">Back</p>
//                             <img
//                                 //@ts-ignore
//                                 src={formData.idBackImageURL}
//                                 alt="ID Back"
//                                 className="w-full h-20 object-cover rounded border"
//                             />
//                         </div>
//                     </div>
//                 </div>
//             </div>
//
//             <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg">
//                 <div className="flex items-start space-x-2">
//                     <Info size={14} className="text-amber-600 dark:text-amber-400 mt-0.5"/>
//                     <p className="text-xs text-amber-700 dark:text-amber-300">
//                         Request will be sent to admin for approval. You'll be notified of the status.
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
//
//     const renderSuccess = () => (
//         <div className="text-center py-6">
//             <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
//                 <Check size={20} className="text-green-600"/>
//             </div>
//             <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Request Submitted</h3>
//             <p className="text-sm text-gray-500 mb-4">
//                 Onboarding request for {formData.fullName} has been submitted successfully.
//             </p>
//             <button
//                 onClick={handleNewRequest}
//                 className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
//             >
//                 Submit Another Request
//             </button>
//         </div>
//     );
//
//     const renderStepIndicator = () => (
//         <div className="flex items-center justify-center mb-6">
//             {[1, 2, 3].map((s) => (
//                 <div key={s} className="flex items-center">
//                     <div
//                         className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
//                             step >= s ? "bg-green-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
//                         }`}
//                     >
//                         {s}
//                     </div>
//                     {s < 3 && (
//                         <div
//                             className={`w-8 h-0.5 ${
//                                 step > s ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"
//                             }`}
//                         ></div>
//                     )}
//                 </div>
//             ))}
//         </div>
//     );
//
//     return (
//         <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 min-h-screen">
//             {/* Header */}
//             <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
//                 <div className="flex items-center space-x-2">
//                     <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
//                         <UserPlus size={16} className="text-white"/>
//                     </div>
//                     <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Onboard Staff</h1>
//                 </div>
//                 <button
//                     onClick={onClose}
//                     className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
//                 >
//                     <X size={16} className="text-gray-600 dark:text-gray-300"/>
//                 </button>
//             </div>
//
//             <div className="p-4">
//                 {success ? (
//                     renderSuccess()
//                 ) : (
//                     <form onSubmit={handleSubmit}>
//                         {renderStepIndicator()}
//
//                         {error && (
//                             <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r">
//                                 <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
//                             </div>
//                         )}
//
//                         <div className="mb-6">
//                             {step === 1 && renderStep1()}
//                             {step === 2 && renderStep2()}
//                             {step === 3 && renderStep3()}
//                         </div>
//
//                         <div className="flex justify-between">
//                             {step > 1 ? (
//                                 <button
//                                     type="button"
//                                     onClick={handlePrevStep}
//                                     className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
//                                 >
//                                     <ArrowLeft size={14} className="mr-1"/>
//                                     Previous
//                                 </button>
//                             ) : (
//                                 <div></div>
//                             )}
//
//                             {step < 3 ? (
//                                 <button
//                                     type="button"
//                                     onClick={handleNextStep}
//                                     className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
//                                 >
//                                     Next
//                                 </button>
//                             ) : (
//                                 <button
//                                     type="submit"
//                                     disabled={loading}
//                                     className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
//                                 >
//                                     {loading ? "Submitting..." : "Submit Request"}
//                                 </button>
//                             )}
//                         </div>
//                     </form>
//                 )}
//             </div>
//         </div>
//     );
// }

"use client"
import {ChangeEvent, useRef, useState} from "react";
import {ArrowLeft, Check, Eye, Info, Shield, Upload, UserPlus, Users, X} from "lucide-react";
import {onboardingService, storageService} from "@/services";
import {generateUUID} from "@/helper";
import {StaffType, User, UserRole} from "@/models";

type Closure = () => void;

export default function OnboardStaff({user, onClose}: {
    user: User,
    onClose: Closure
}) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const idFrontRef = useRef<HTMLInputElement>(null);
    const idBackRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        fullName: "",
        idNumber: "",
        phoneNumber: "",
        email: "",
        mobigoNumber: "",
        staffRole: "van_ba",
        idFrontImage: null as File | null,
        idBackImage: null as File | null,
        idFrontImageURL: null as string | null,
        idBackImageURL: null as string | null
    });

    const handleChange = (e: any) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError("Image size should be less than 5MB");
            return;
        }

        if (!file.type.includes("image/")) {
            setError("Please upload an image file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setFormData({
                ...formData,
                [type]: file,
                [`${type}URL`]: event.target?.result as string
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

        const phoneRegex = /^[0-9]{9,12}$/;
        if (!phoneRegex.test(formData.phoneNumber)) {
            setError("Please enter a valid phone number");
            return false;
        }

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
        if (step !== 3) return;
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const key = `team-${generateUUID()}-${formData.idNumber}${Date.now()}`;
            const {url: idFrontURL} = await storageService.uploadIdFrontImage(
                key,
                formData.idFrontImage as File,
            );

            const {url: idBackURL} = await storageService.uploadIdBackImage(
                key,
                formData.idBackImage as File,
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
                role: UserRole.STAFF,
                staff_type: formData.staffRole as StaffType
            });

            if (error) throw error;

            setSuccess(true);
            resetForm();
            // Trigger a refresh of onboarding requests
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('fetchOnboard');
                window.dispatchEvent(event);
            }
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

    const inputClasses = "w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200";

    const renderStep1 = () => (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center pb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Information</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Enter the basic details for the new team member</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        name="fullName"
                        type="text"
                        placeholder="Enter staff full name"
                        className={inputClasses}
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="phoneNumber"
                            type="text"
                            placeholder="Enter phone number"
                            className={inputClasses}
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="email"
                            type="email"
                            placeholder="Enter email address"
                            className={inputClasses}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            ID Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="idNumber"
                            type="text"
                            placeholder="Enter national ID number"
                            className={inputClasses}
                            value={formData.idNumber}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Staff Role
                        </label>
                        <select
                            name="staffRole"
                            className={inputClasses}
                            value={formData.staffRole}
                            onChange={handleChange}
                        >
                            <option value="van_ba">Van BA</option>
                            <option value="driver">Driver</option>
                            <option value="assistant">Assistant</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center pb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Identity Verification</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Upload clear photos of both sides of the ID</p>
            </div>

            {/* Upload Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Front ID */}
                <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        ID Front <span className="text-red-500">*</span>
                    </label>

                    {formData.idFrontImageURL ? (
                        <div className="relative group">
                            <img
                                src={formData.idFrontImageURL}
                                alt="ID Front Preview"
                                className="w-full h-56 object-cover rounded-2xl border-4 border-gray-200 dark:border-gray-600 shadow-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-2xl transition-all duration-200 flex items-center justify-center">
                                <button
                                    onClick={() => setFormData({...formData, idFrontImage: null, idFrontImageURL: null})}
                                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                >
                                    <X size={20}/>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => idFrontRef.current?.click()}
                            className="border-3 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 h-56 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 bg-gray-50 dark:bg-gray-800"
                        >
                            <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-xl mb-4">
                                <Upload size={32} className="text-green-600 dark:text-green-400"/>
                            </div>
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Upload ID Front</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">JPG, PNG under 5MB</p>
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

                {/* Back ID */}
                <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        ID Back <span className="text-red-500">*</span>
                    </label>

                    {formData.idBackImageURL ? (
                        <div className="relative group">
                            <img
                                src={formData.idBackImageURL}
                                alt="ID Back Preview"
                                className="w-full h-56 object-cover rounded-2xl border-4 border-gray-200 dark:border-gray-600 shadow-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-2xl transition-all duration-200 flex items-center justify-center">
                                <button
                                    onClick={() => setFormData({...formData, idBackImage: null, idBackImageURL: null})}
                                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                >
                                    <X size={20}/>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => idBackRef.current?.click()}
                            className="border-3 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 h-56 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 bg-gray-50 dark:bg-gray-800"
                        >
                            <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-xl mb-4">
                                <Upload size={32} className="text-green-600 dark:text-green-400"/>
                            </div>
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Upload ID Back</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">JPG, PNG under 5MB</p>
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

            {/* Guidelines */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                        <Info size={24} className="text-blue-600 dark:text-blue-400"/>
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">ID Document Guidelines</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800 dark:text-blue-200">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>Ensure ID is not expired</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>All corners must be visible</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>Information clearly readable</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>No glare or shadows</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center pb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
                    <Eye className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review & Submit</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Please review all information before submitting</p>
            </div>

            {/* Review Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-purple-600 p-6">
                    <h3 className="text-xl font-bold text-white">Staff Information Summary</h3>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Full Name</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{formData.fullName}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID Number</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{formData.idNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone Number</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{formData.phoneNumber}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{formData.email}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Staff Role</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1 capitalize">{formData.staffRole.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Team Leader</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{user?.full_name || 'Current user'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">ID Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">ID Front</p>
                                <img
                                    src={formData.idFrontImageURL || ''}
                                    alt="ID Front"
                                    className="w-full h-40 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">ID Back</p>
                                <img
                                    src={formData.idBackImageURL || ''}
                                    alt="ID Back"
                                    className="w-full h-40 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notice */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-start space-x-4">
                    <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg">
                        <Info size={24} className="text-amber-600 dark:text-amber-400"/>
                    </div>
                    <div className="text-amber-800 dark:text-amber-200">
                        <p className="font-medium">Your request will be sent to an administrator for approval. You'll be notified once the request is approved or rejected.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-8 shadow-2xl">
                <Check size={48} className="text-white"/>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Request Submitted Successfully!</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Your request to onboard <span className="font-semibold text-green-600 dark:text-green-400">{formData.fullName}</span> has been submitted. An administrator will review it shortly.
            </p>
            <button
                onClick={handleNewRequest}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
                <UserPlus className="mr-2" size={20} />
                Submit Another Request
            </button>
        </div>
    );

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-4">
                {[
                    { num: 1, icon: Users, label: "Details" },
                    { num: 2, icon: Shield, label: "Documents" },
                    { num: 3, icon: Eye, label: "Review" }
                ].map((s, index) => (
                    <div key={s.num} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div
                                className={`flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg transition-all duration-200 ${
                                    step >= s.num
                                        ? "bg-gradient-to-br from-green-500 to-purple-600 text-white"
                                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                }`}
                            >
                                <s.icon size={24} />
                            </div>
                            <p className={`text-sm font-medium mt-2 ${
                                step >= s.num
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-gray-500 dark:text-gray-400"
                            }`}>
                                {s.label}
                            </p>
                        </div>
                        {index < 2 && (
                            <div
                                className={`w-16 h-1 mx-4 rounded-full transition-all duration-200 ${
                                    step > s.num
                                        ? "bg-gradient-to-r from-green-500 to-purple-600"
                                        : "bg-gray-200 dark:bg-gray-700"
                                }`}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-br from-green-500 to-purple-600 p-3 rounded-xl shadow-lg">
                                <UserPlus size={24} className="text-white"/>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Onboarding</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Add new team members to your organization</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 group"
                        >
                            <X size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white"/>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="overflow-y-auto flex-grow mx-auto w-full px-4 py-12">
                {success ? (
                    renderSuccess()
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {renderStepIndicator()}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-xl">
                                <div className="flex items-center">
                                    <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg mr-4">
                                        <X size={20} className="text-red-600 dark:text-red-400"/>
                                    </div>
                                    <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 lg:p-12">
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between items-center pt-8">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    className="flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    <ArrowLeft size={20} className="mr-2"/>
                                    Previous
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    Next Step
                                    <ArrowLeft size={20} className="ml-2 rotate-180"/>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={20} className="mr-2"/>
                                            Submit Request
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
