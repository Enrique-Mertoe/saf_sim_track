import React from 'react';

const BatchMetadataModalContent = ({ batchId, selectedTeam, user, onClose, resolve, reject }) => {
    // Local state for form fields
    const [formData, setFormData] = React.useState({
        batch_id: batchId,
        team_id: selectedTeam,
        created_by_user_id: user.id,
        order_number: "",
        requisition_number: "",
        company_name: "",
        collection_point: "",
        move_order_number: "",
        date_created: new Date().toISOString().split('T')[0],
        lot_numbers: [],
        item_description: "",
        quantity: ""
    });

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle lot numbers input (comma-separated)
    const handleLotNumbersChange = (e) => {
        const lotNumbers = e.target.value.split(',').map(lot => lot.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, lot_numbers: lotNumbers }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        onClose();
        resolve(formData);
    };

    const handleCancel = () => {
        onClose();
        reject(new Error("Metadata entry cancelled"));
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Batch Metadata</h2>
                <button
                    onClick={handleCancel}
                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
                No metadata was detected from the uploaded file. Please enter batch information:
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Order Number
                        </label>
                        <input
                            type="text"
                            name="order_number"
                            value={formData.order_number}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Requisition Number
                        </label>
                        <input
                            type="text"
                            name="requisition_number"
                            value={formData.requisition_number}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Company Name
                        </label>
                        <input
                            type="text"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Collection Point
                        </label>
                        <input
                            type="text"
                            name="collection_point"
                            value={formData.collection_point}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Move Order Number
                        </label>
                        <input
                            type="text"
                            name="move_order_number"
                            value={formData.move_order_number}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date Created
                        </label>
                        <input
                            type="date"
                            name="date_created"
                            value={formData.date_created}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Lot Numbers (comma-separated)
                        </label>
                        <input
                            type="text"
                            name="lot_numbers"
                            value={(formData.lot_numbers || []).join(', ')}
                            onChange={handleLotNumbersChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quantity
                        </label>
                        <input
                            type="text"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Item Description
                    </label>
                    <input
                        type="text"
                        name="item_description"
                        value={formData.item_description}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Save Metadata
                    </button>
                </div>
            </form>
        </div>
    );
};
export default BatchMetadataModalContent