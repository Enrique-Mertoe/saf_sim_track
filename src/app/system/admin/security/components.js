// =============================================
// INCIDENT DETAIL MODAL
// =============================================
export const IncidentDetailModal = ({ incident, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [newEvent, setNewEvent] = useState('');

    const addTimelineEvent = async () => {
        if (!newEvent.trim()) return;

        try {
            await fetch(`/api/system/security/incidents/${incident.id}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'update',
                    description: newEvent,
                    actor: 'Current User' // Replace with actual user
                })
            });
            setNewEvent('');
            onUpdate();
        } catch (error) {
            console.error('Failed to add timeline event:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
    <div className="flex items-center justify-between">
    <div>
        <h2 className="text-xl font-bold text-gray-900">{incident.title}</h2>
        <p className="text-sm text-gray-600 mt-1">#{incident.id}</p>
    </div>
    <button
    onClick={onClose}
    className="text-gray-400 hover:text-gray-600"
        >
              ✕
            </button>
            </div>

    {/* Tabs */}
    <div className="mt-4 border-b border-gray-200">
    <nav className="-mb-px flex space-x-8">
        {['overview', 'timeline', 'response', 'analysis'].map((tab) => (
        <button
            key={tab}
    onClick={() => setActiveTab(tab)}
    className={`py-2 px-1 border-b-2 font-medium text-sm ${
        activeTab === tab
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
>
    {tab.charAt(0).toUpperCase() + tab.slice(1)}
    </button>
))}
    </nav>
    </div>
    </div>

    {/* Content */}
    <div className="p-6 overflow-y-auto max-h-96">
        {activeTab === 'overview' && (
            <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
            <div>
                <h4 className="font-medium text-gray-900 mb-2">Incident Details</h4>
    <div className="space-y-2 text-sm">
    <div className="flex justify-between">
    <span className="text-gray-600">Severity:</span>
    <span className="font-medium">{incident.severity}</span>
        </div>
        <div className="flex justify-between">
    <span className="text-gray-600">Status:</span>
    <span className="font-medium">{incident.status}</span>
        </div>
        <div className="flex justify-between">
    <span className="text-gray-600">Category:</span>
    <span className="font-medium">{incident.category}</span>
        </div>
        <div className="flex justify-between">
    <span className="text-gray-600">Attack Vector:</span>
    <span className="font-medium">{incident.attackVector}</span>
    </div>
    </div>
    </div>

    <div>
    <h4 className="font-medium text-gray-900 mb-2">Assignment</h4>
        <div className="space-y-2 text-sm">
    <div className="flex justify-between">
    <span className="text-gray-600">Assigned To:</span>
    <span className="font-medium">{incident.assignedTo || 'Unassigned'}</span>
        </div>
        <div className="flex justify-between">
    <span className="text-gray-600">Team:</span>
    <span className="font-medium">{incident.team}</span>
        </div>
        <div className="flex justify-between">
    <span className="text-gray-600">Detected At:</span>
    <span className="font-medium">
    {new Date(incident.detectedAt).toLocaleString()}
    </span>
    </div>
    </div>
    </div>
    </div>

    <div>
    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
    {incident.description}
    </p>
    </div>

    <div>
    <h4 className="font-medium text-gray-900 mb-2">Affected Systems</h4>
    <div className="flex flex-wrap gap-2">
        {incident.affectedSystems.map((system, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {system}
                </span>
))}
    </div>
    </div>
    </div>
)}

    {activeTab === 'timeline' && (
        <div className="space-y-4">
        <div className="flex gap-3">
        <input
            type="text"
        value={newEvent}
        onChange={(e) => setNewEvent(e.target.value)}
        placeholder="Add timeline event..."
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
        />
        <button
            onClick={addTimelineEvent}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
            Add
            </button>
            </div>

            <div className="space-y-3">
        {incident.timeline?.map((event) => (
                <div key={event.id} className="flex gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
            <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">{event.description}</p>
                <span className="text-xs text-gray-500">
                {new Date(event.occurredAt).toLocaleString()}
                </span>
                </div>
                <p className="text-sm text-gray-600">By {event.actor}</p>
    </div>
    </div>
    ))}
        </div>
        </div>
    )}
    </div>
    </div>
    </div>
);
};
