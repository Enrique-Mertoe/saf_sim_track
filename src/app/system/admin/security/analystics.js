import {useEffect, useState} from "react";

export // =============================================
// MACHINE LEARNING ANOMALY DETECTION
// =============================================

const AnomalyDetectionDashboard = () => {
    const [anomalies, setAnomalies] = useState([]);
    const [modelMetrics, setModelMetrics] = useState({
        accuracy: 0.94,
        precision: 0.91,
        recall: 0.88,
        f1Score: 0.89,
        lastTrained: '2024-01-15T10:30:00Z',
        trainingDataPoints: 125000,
        falsePositiveRate: 0.06
    });
    const [trainingStatus, setTrainingStatus] = useState('ready');

    useEffect(() => {
        fetchAnomalies();
        fetchModelMetrics();
    }, []);

    const fetchAnomalies = async () => {
        try {
            const response = await fetch('/api/system/system/security/analytics/anomalies');
            const data = await response.json();
            setAnomalies(data.anomalies || []);
        } catch (error) {
            console.error('Failed to fetch anomalies:', error);
        }
    };

    const fetchModelMetrics = async () => {
        try {
            const response = await fetch('/api/system/system/security/ml/model-metrics');
            const data = await response.json();
            setModelMetrics(data.metrics);
        } catch (error) {
            console.error('Failed to fetch model metrics:', error);
        }
    };

    const retrainModel = async () => {
        try {
            setTrainingStatus('training');
            await fetch('/api/system/system/security/ml/retrain', { method: 'POST' });
            setTrainingStatus('ready');
            fetchModelMetrics();
        } catch (error) {
            console.error('Failed to retrain model:', error);
            setTrainingStatus('error');
        }
    };

    return (
        <div className="space-y-6">
            {/* ML Model Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        ML Model Performance
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{(modelMetrics.accuracy * 100).toFixed(1)}%</p>
                            <p className="text-sm text-gray-600">Accuracy</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{(modelMetrics.precision * 100).toFixed(1)}%</p>
                            <p className="text-sm text-gray-600">Precision</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-orange-600">{(modelMetrics.recall * 100).toFixed(1)}%</p>
                            <p className="text-sm text-gray-600">Recall</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-purple-600">{(modelMetrics.f1Score * 100).toFixed(1)}%</p>
                            <p className="text-sm text-gray-600">F1-Score</p>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Last Training</span>
                            <span className="text-sm font-medium">
        {new Date(modelMetrics.lastTrained).toLocaleDateString()}
        </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Training Data Points</span>
                            <span className="text-sm font-medium">
        {modelMetrics.trainingDataPoints.toLocaleString()}
        </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">False Positive Rate</span>
                            <span className="text-sm font-medium text-red-600">
        {(modelMetrics.falsePositiveRate * 100).toFixed(2)}%
    </span>
                        </div>
                    </div>

                    <button
                        onClick={retrainModel}
                        disabled={trainingStatus === 'training'}
                        className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                    >
                        {trainingStatus === 'training' ? 'Training...' : 'Retrain Model'}
                    </button>
                </div>

                {/* Anomaly Detection Results */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Recent Anomalies Detected
                    </h3>

                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {anomalies.slice(0, 10).map((anomaly, idx) => (
                            <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900">{anomaly.type}</span>
                                    <span className="text-xs text-gray-500">
                {new Date(anomaly.detectedAt).toLocaleTimeString()}
                </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>
                                <div className="flex items-center justify-between">
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                Score: {anomaly.score.toFixed(3)}
    </span>
                                    <span className="text-xs text-gray-500">IP: {anomaly.ipAddress}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Anomaly Patterns Visualization */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Anomaly Pattern Analysis
                </h3>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                type="number"
                                dataKey="requestVolume"
                                name="Request Volume"
                                stroke="#64748b"
                            />
                            <YAxis
                                type="number"
                                dataKey="anomalyScore"
                                name="Anomaly Score"
                                stroke="#64748b"
                            />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                }}
                            />
                            <Scatter
                                name="Normal Traffic"
                                data={anomalies.filter(a => a.score < 0.7)}
                                fill="#22c55e"
                            />
                            <Scatter
                                name="Suspicious Activity"
                                data={anomalies.filter(a => a.score >= 0.7 && a.score < 0.9)}
                                fill="#f59e0b"
                            />
                            <Scatter
                                name="High Risk Anomalies"
                                data={anomalies.filter(a => a.score >= 0.9)}
                                fill="#ef4444"
                            />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};