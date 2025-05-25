"use client"
import {useEffect, useState} from 'react';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    FileText,
    Phone,
    RefreshCw,
    Search,
    User,
    X
} from 'lucide-react';
import {AnimatePresence, motion} from 'framer-motion';
import Dashboard from "@/ui/components/dash/Dashboard";
import useApp from "@/ui/provider/AppProvider";
import {toast} from 'react-hot-toast';
import {createSupabaseClient} from "@/lib/supabase/client";
import {useDialog} from "@/app/_providers/dialog";
import {User as User1} from "@/models";

// Define the invoice status types
type InvoiceStatus = 'completed' | 'pending' | 'failed';

// Define the invoice interface
interface Invoice {
    id: string;
    reference: string;
    amount: number;
    status: InvoiceStatus;
    created_at: string;
    updated_at: string;
    plan_id: string;
    user_id: string;
    phone_number: string;
    provider_id?: string;
    checkout_url?: string;
    user: User1
}

export default function InvoicesPageView() {
    const {user} = useApp();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [error, setError] = useState<string | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // Fetch invoices from Supabase
    const fetchInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createSupabaseClient();

            // Fetch payment requests (invoices) for the current user
            const {data, error} = await supabase
                .from('payment_requests')
                .select('*,user:user_id(full_name,email,phone_number)')
                .eq('user_id', user?.id)
                .order('created_at', {ascending: false});

            if (error) {
                throw error;
            }

            setInvoices(data || []);
            setFilteredInvoices(data || []);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            setError('Failed to load invoices. Please try again later.');
            toast.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort invoices
    const filterAndSortInvoices = () => {
        let filtered = [...invoices];

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(invoice => invoice.status === statusFilter);
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(invoice =>
                invoice.reference.toLowerCase().includes(term) ||
                invoice.plan_id.toLowerCase().includes(term) ||
                invoice.amount.toString().includes(term)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setFilteredInvoices(filtered);
    };

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Handle status filter change
    const handleStatusFilterChange = (status: InvoiceStatus | 'all') => {
        setStatusFilter(status);
    };

    // Handle sort order change
    const handleSortOrderChange = () => {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Get status badge
    const getStatusBadge = (status: InvoiceStatus) => {
        switch (status) {
            case 'completed':
                return (
                    <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1"/>
            Paid
          </span>
                );
            case 'pending':
                return (
                    <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1"/>
            Pending
          </span>
                );
            case 'failed':
                return (
                    <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1"/>
            Failed
          </span>
                );
            default:
                return null;
        }
    };

    // Download invoice as PDF
    const downloadInvoice = async (invoice: Invoice) => {
        toast.success('Invoice download started');

        try {
            // Dynamically import jsPDF from CDN
            //@ts-ignore
            const jsPDFModule = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm');
            const jsPDF = jsPDFModule.default;

            // Create a new PDF document
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Set font styles
            doc.setFont('helvetica', 'normal');

            // Add company logo/header
            doc.setFontSize(20);
            doc.setTextColor(0, 128, 0); // Green color
            doc.text('SIM Card Management System', 105, 20, {align: 'center'});

            // Add invoice title
            doc.setFontSize(16);
            doc.setTextColor(0, 0, 0);
            doc.text(`INVOICE #${invoice.reference.substring(0, 8)}`, 105, 30, {align: 'center'});

            // Add invoice details
            doc.setFontSize(10);
            doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 45);
            doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 50);

            // Add customer information
            doc.setFontSize(12);
            doc.text('Customer Information', 20, 65);
            doc.setFontSize(10);
            doc.text(`Name: ${invoice.user.full_name}`, 20, 72);
            doc.text(`Phone: ${invoice.phone_number}`, 20, 77);

            // Add subscription details
            doc.setFontSize(12);
            doc.text('Subscription Details', 20, 90);
            doc.setFontSize(10);
            doc.text(`Plan: ${invoice.plan_id.toUpperCase()}`, 20, 97);
            doc.text('This subscription provides access to all features of the SIM Card', 20, 102);
            doc.text('Management System for a period of 30 days.', 20, 107);

            // Add payment details
            doc.setFontSize(12);
            doc.text('Payment Details', 20, 120);
            doc.setFontSize(10);
            doc.text(`Amount: KES ${invoice.amount.toLocaleString()}`, 20, 127);
            doc.text(`Reference ID: ${invoice.reference}`, 20, 132);
            if (invoice.provider_id) {
                doc.text(`Provider ID: ${invoice.provider_id}`, 20, 137);
            }

            // Add footer
            doc.setFontSize(8);
            doc.text('This is a computer-generated document and does not require a signature.', 105, 280, {align: 'center'});

            // Save the PDF
            doc.save(`Invoice-${invoice.reference.substring(0, 8)}.pdf`);

            toast.success(`Invoice ${invoice.reference} downloaded`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF. Please try again later.');
        }
    };
    const dialog = useDialog()
    // Open invoice details modal
    const openInvoiceDetails = (selectedInvoice: Invoice) => {
        console.log("Invoice details modal opened", selectedInvoice)
        const d = dialog.create({
            size: "lg",
            radius: "lg",
            content: <AnimatePresence>
                <motion.div
                    initial={{opacity: 0, scale: 0.9}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0, scale: 0.9}}
                    transition={{type: 'spring', damping: 20}}
                    className="bg-white dark:bg-gray-800 rounded-lg w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Modal Header */}
                    <div
                        className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-green-600 dark:text-green-400"/>
                            Invoice Details
                        </h3>
                        <button
                            onClick={() => d.dismiss()}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                        >
                            <X className="w-5 h-5"/>
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6">
                        {/* Invoice Header */}
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Invoice #{selectedInvoice.reference.substring(0, 8)}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(selectedInvoice.created_at)}
                                </p>
                            </div>
                            <div className="mt-2 md:mt-0">
                                {getStatusBadge(selectedInvoice.status)}
                            </div>
                        </div>

                        {/* Invoice Details */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Payment Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start">
                                    <CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-2"/>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</p>
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                            KES {selectedInvoice.amount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-2"/>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment
                                            Date</p>
                                        <p className="text-gray-900 dark:text-white">
                                            {new Date(selectedInvoice.updated_at || selectedInvoice.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-2"/>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone
                                            Number</p>
                                        <p className="text-gray-900 dark:text-white">{selectedInvoice.phone_number}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <User className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-2"/>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">User
                                            Name</p>
                                        <p className="text-gray-900 dark:text-white">{selectedInvoice.user.full_name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subscription Details */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Subscription Details</h5>
                            <div className="flex items-center mb-3">
                                <DollarSign className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2"/>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan</p>
                                    <p className="text-gray-900 dark:text-white capitalize">{selectedInvoice.plan_id}</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                This subscription provides access to all features of the SIM Card Management System
                                for a period of 30 days.
                            </p>
                        </div>

                        {/* Additional Information */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Additional
                                Information</h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                <span className="font-medium">Reference ID:</span> {selectedInvoice.reference}
                            </p>
                            {selectedInvoice.provider_id && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                    <span className="font-medium">Provider ID:</span> {selectedInvoice.provider_id}
                                </p>
                            )}
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span
                                        className="font-medium">Created:</span> {new Date(selectedInvoice.created_at).toLocaleString()}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => d.dismiss()}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Close
                            </button>
                            {selectedInvoice.status === 'completed' && (
                                <button
                                    onClick={() => {
                                        downloadInvoice(selectedInvoice);
                                        d.dismiss();
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                                >
                                    <Download className="w-4 h-4 mr-1"/>
                                    Download PDF
                                </button>
                            )}
                            {selectedInvoice.status === 'pending' && selectedInvoice.checkout_url && (
                                <a
                                    href={selectedInvoice.checkout_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                                >
                                    <CreditCard className="w-4 h-4 mr-1"/>
                                    Pay Now
                                </a>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        })
    };


    // Effect to fetch invoices on component mount
    useEffect(() => {
        if (user) {
            fetchInvoices();
        }
    }, [user]);

    // Effect to filter and sort invoices when filters change
    useEffect(() => {
        filterAndSortInvoices();
    }, [invoices, searchTerm, statusFilter, sortOrder]);

    return (
        <Dashboard>
            <div className="p-6 min-h-full">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
                        Invoices & Payments
                    </h1>
                    <button
                        onClick={fetchInvoices}
                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2"/>
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <motion.div
                        whileHover={{y: -5}}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500"
                    >
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 mr-4">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Paid Invoices</p>
                                <p className="text-xl font-semibold text-gray-800 dark:text-white">
                                    {invoices.filter(i => i.status === 'completed').length}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{y: -5}}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-500"
                    >
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 mr-4">
                                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Invoices</p>
                                <p className="text-xl font-semibold text-gray-800 dark:text-white">
                                    {invoices.filter(i => i.status === 'pending').length}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{y: -5}}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500"
                    >
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 mr-4">
                                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                                <p className="text-xl font-semibold text-gray-800 dark:text-white">
                                    KES {invoices
                                    .filter(i => i.status === 'completed')
                                    .reduce((sum, invoice) => sum + invoice.amount, 0)
                                    .toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400"/>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="Search invoices..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleStatusFilterChange('all')}
                                className={`px-3 py-2 rounded-md text-sm font-medium ${
                                    statusFilter === 'all'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => handleStatusFilterChange('completed')}
                                className={`px-3 py-2 rounded-md text-sm font-medium ${
                                    statusFilter === 'completed'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}
                            >
                                Paid
                            </button>
                            <button
                                onClick={() => handleStatusFilterChange('pending')}
                                className={`px-3 py-2 rounded-md text-sm font-medium ${
                                    statusFilter === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => handleStatusFilterChange('failed')}
                                className={`px-3 py-2 rounded-md text-sm font-medium ${
                                    statusFilter === 'failed'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}
                            >
                                Failed
                            </button>

                            <button
                                onClick={handleSortOrderChange}
                                className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium"
                            >
                                <Calendar className="h-4 w-4 mr-1"/>
                                {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div
                                className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading invoices...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4"/>
                            <p className="text-red-500">{error}</p>
                            <button
                                onClick={fetchInvoices}
                                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="p-8 text-center">
                            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No invoices
                                found</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {searchTerm || statusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'You have no invoices yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Invoice
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Plan
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody
                                    className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredInvoices.map((invoice) => (
                                    <motion.tr
                                        key={invoice.id}
                                        initial={{opacity: 0, y: 20}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{duration: 0.3}}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                        onClick={() => openInvoiceDetails(invoice)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {invoice.reference.substring(0, 8)}...
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                ID: {invoice.id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {formatDate(invoice.created_at)}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(invoice.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white capitalize">
                                                {invoice.plan_id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                KES {invoice.amount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {invoice.status === 'completed' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent row click event
                                                        downloadInvoice(invoice);
                                                    }}
                                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 inline-flex items-center"
                                                >
                                                    <Download className="w-4 h-4 mr-1"/>
                                                    Download PDF
                                                </button>
                                            )}
                                            {invoice.status === 'pending' && invoice.checkout_url && (
                                                <a
                                                    href={invoice.checkout_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()} // Prevent row click event
                                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
                                                >
                                                    <CreditCard className="w-4 h-4 mr-1"/>
                                                    Pay Now
                                                </a>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    );
}
