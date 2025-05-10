import React, { useState, useEffect } from 'react';
import {
  Award,
  BarChart4,
  CheckCircle,
  Smartphone,
  Users,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { teamService } from '@/services/teamService';
import { motion } from 'framer-motion';

export const TeamStats = () => {
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    activeSIM: 0,
    qualityPercentage: 0,
    monthlyTarget: 0,
    targetCompletion: 0,
    performanceTrend: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [showDetails, setShowDetails] = useState(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      setIsLoading(true);
      try {
        // Get the first team or use the selected one
        const { data: teams } = await teamService.getAllTeams();
        const teamId = selectedTeamId || (teams && teams[0]?.id);

        if (teamId) {
          setSelectedTeamId(teamId);

          // Get team performance data
          const { data: performanceData } = await teamService.getTeamPerformance(teamId);

          // Get team members count
          const { data: teamMembers } = await teamService.getTeamHierarchy(teamId);

          if (performanceData && performanceData.length > 0 && teamMembers) {
            const currentPerformance = performanceData[0];

            setTeamStats({
              totalMembers: teamMembers.length,
              activeSIM: currentPerformance.active_sim_count || 0,
              qualityPercentage: currentPerformance.quality_score || 0,
              monthlyTarget: currentPerformance.monthly_target || 0,
              targetCompletion: currentPerformance.target_completion || 0,
              performanceTrend: currentPerformance.performance_trend || 0
            });
          }
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [selectedTeamId]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getStatusColor = (percentage:any) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const handleCardClick = (cardName:any) => {
    setShowDetails(showDetails === cardName ? null : cardName);
  };

  return (
    <div className="mb-12">
      {/* Header with animated gradient background */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-6 mb-8 shadow-lg"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-8"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white">Team Performance Dashboard</h2>
          <p className="text-indigo-100 mt-1">Real-time metrics and analytics</p>

          <div className="mt-4 flex items-center">
            <div className="bg-white/20 rounded-full px-4 py-1 text-white text-sm font-medium backdrop-blur-sm">
              {isLoading ? 'Loading...' : `Target Completion: ${teamStats.targetCompletion}%`}
            </div>

            <div className="ml-4 flex items-center">
              <div className={`h-2 w-2 rounded-full ${teamStats.targetCompletion >= 70 ? 'bg-green-400' : teamStats.targetCompletion >= 40 ? 'bg-amber-400' : 'bg-rose-400'} mr-2`}></div>
              <span className="text-xs text-white font-medium">
                {teamStats.targetCompletion >= 70 ? 'On Track' : teamStats.targetCompletion >= 40 ? 'Needs Attention' : 'At Risk'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Team Members */}
        <motion.div
          className="group relative cursor-pointer bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={() => handleCardClick('members')}
        >
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">Team</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-700">Team Members</h3>
            <div className="mt-2 flex items-end justify-between">
              <div>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-3xl font-bold text-gray-900">{teamStats.totalMembers}</span>
                  </motion.div>
                )}
                <p className="text-sm text-gray-500 mt-1">Active personnel</p>
              </div>
              <div className="flex items-center text-gray-400 group-hover:text-indigo-600 transition-colors duration-300">
                <span className="text-sm mr-1">Details</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Expandable section */}
          {showDetails === 'members' && (
            <motion.div
              className="bg-gray-50 absolute bottom-0 p-4 border-t border-gray-100"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm text-gray-600">Member distribution by role:</p>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Team Leaders</span>
                  <span className="text-xs font-medium">{Math.ceil(teamStats.totalMembers * 0.1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Field Agents</span>
                  <span className="text-xs font-medium">{Math.ceil(teamStats.totalMembers * 0.7)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Support Staff</span>
                  <span className="text-xs font-medium">{Math.floor(teamStats.totalMembers * 0.2)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Active SIMs */}
        <motion.div
          className="group relative cursor-pointer bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.2 }}
          onClick={() => handleCardClick('sims')}
        >
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div className="bg-green-50 p-3 rounded-lg">
                <Smartphone className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">Connectivity</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-700">Active SIMs</h3>
            <div className="mt-2 flex items-end justify-between">
              <div>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-3xl font-bold text-gray-900">{teamStats.activeSIM.toLocaleString()}</span>
                  </motion.div>
                )}
                <p className="text-sm text-gray-500 mt-1">Total connections</p>
              </div>
              <div className="flex items-center text-gray-400 group-hover:text-green-600 transition-colors duration-300">
                <span className="text-sm mr-1">Details</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Expandable section */}
          {showDetails === 'sims' && (
            <motion.div
              className="bg-gray-50 absolute bottom-0 p-4 border-t border-gray-100"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm text-gray-600">SIM activation status:</p>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">88% Active</span>
                  <span className="text-xs text-gray-500">12% Pending</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Quality Percentage */}
        <motion.div
          className="group relative cursor-pointer bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.3 }}
          onClick={() => handleCardClick('quality')}
        >
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">Quality</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-700">Quality Score</h3>
            <div className="mt-2 flex items-end justify-between">
              <div>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-3xl font-bold text-gray-900">{teamStats.qualityPercentage}%</span>
                  </motion.div>
                )}
                <p className="text-sm text-gray-500 mt-1">Performance quality</p>
              </div>
              <div className="flex items-center text-gray-400 group-hover:text-blue-600 transition-colors duration-300">
                <span className="text-sm mr-1">Details</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Expandable section */}
          {showDetails === 'quality' && (
            <motion.div
              className="bg-gray-50 absolute bottom-0 p-4 border-t border-gray-100"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm text-gray-600">Quality metrics breakdown:</p>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Data Accuracy</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${teamStats.qualityPercentage - 5}%` }}></div>
                    </div>
                    <span className="text-xs font-medium">{teamStats.qualityPercentage - 5}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Customer Satisfaction</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${teamStats.qualityPercentage + 2}%` }}></div>
                    </div>
                    <span className="text-xs font-medium">{teamStats.qualityPercentage + 2}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Process Compliance</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${teamStats.qualityPercentage - 2}%` }}></div>
                    </div>
                    <span className="text-xs font-medium">{teamStats.qualityPercentage - 2}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Monthly Target */}
        <motion.div
          className="group relative cursor-pointer bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.4 }}
          onClick={() => handleCardClick('target')}
        >
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div className="bg-amber-50 p-3 rounded-lg">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700">Goals</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-700">Monthly Target</h3>
            <div className="mt-2 flex items-end justify-between">
              <div>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-3xl font-bold text-gray-900">{teamStats.monthlyTarget.toLocaleString()}</span>
                  </motion.div>
                )}
                <p className="text-sm text-gray-500 mt-1">SIM activations goal</p>
              </div>
              <div className="flex items-center text-gray-400 group-hover:text-amber-600 transition-colors duration-300">
                <span className="text-sm mr-1">Details</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Expandable section */}
          {showDetails === 'target' && (
            <motion.div
              className="bg-gray-50 absolute bottom-0 p-4 border-t border-gray-100"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm text-gray-600">Target distribution:</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Week 1</span>
                  <span className="text-xs font-medium">{Math.floor(teamStats.monthlyTarget * 0.25).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Week 2</span>
                  <span className="text-xs font-medium">{Math.floor(teamStats.monthlyTarget * 0.25).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Week 3</span>
                  <span className="text-xs font-medium">{Math.floor(teamStats.monthlyTarget * 0.25).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Week 4</span>
                  <span className="text-xs font-medium">{Math.ceil(teamStats.monthlyTarget * 0.25).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Target Completion */}
        <motion.div
          className="group relative cursor-pointer bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.5 }}
          onClick={() => handleCardClick('completion')}
        >
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div className="bg-purple-50 p-3 rounded-lg">
                <BarChart4 className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-50 text-purple-700">Progress</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-700">Target Completion</h3>
            <div className="mt-2 flex items-end justify-between">
              <div>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-3xl font-bold text-gray-900">{teamStats.targetCompletion}%</span>
                  </motion.div>
                )}
                <p className="text-sm text-gray-500 mt-1">Target progress</p>
              </div>
              <div className="flex items-center text-gray-400 group-hover:text-purple-600 transition-colors duration-300">
                <span className="text-sm mr-1">Details</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-6 pb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className={`${getStatusColor(teamStats.targetCompletion)} h-2 rounded-full`}
                initial={{ width: "0%" }}
                animate={{ width: `${teamStats.targetCompletion}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              ></motion.div>
            </div>
          </div>

          {/* Expandable section */}
          {showDetails === 'completion' && (
            <motion.div
              className="bg-gray-50 absolute bottom-0 p-4 border-t border-gray-100"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm text-gray-600">Weekly breakdown:</p>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">This week's goal</span>
                  <span className="text-xs font-medium">{Math.floor(teamStats.monthlyTarget / 4).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">This week's progress</span>
                  <span className="text-xs font-medium">
                    {Math.floor((teamStats.targetCompletion / 100) * (teamStats.monthlyTarget / 4)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Remaining</span>
                  <span className="text-xs font-medium">
                    {Math.ceil((1 - teamStats.targetCompletion / 100) * (teamStats.monthlyTarget / 4)).toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Performance Trend */}
        <motion.div
          className="group cursor-pointer relative bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.6 }}
          onClick={() => handleCardClick('trend')}
        >
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div className="bg-teal-50 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-teal-50 text-teal-700">Trend</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-700">Performance Trend</h3>
            <div className="mt-2 flex items-end justify-between">
              <div>
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center"
                  >
                    <span className="text-3xl font-bold text-gray-900">{teamStats.performanceTrend > 0 ? '+' : ''}{teamStats.performanceTrend}%</span>
                    {teamStats.performanceTrend > 0 ? (
                      <TrendingUp size={20} className="ml-2 text-emerald-500" />
                    ) : (
                      <TrendingUp size={20} className="ml-2 text-rose-500 transform rotate-180" />
                    )}
                  </motion.div>
                )}
                <p className="text-sm text-gray-500 mt-1">vs. last month</p>
              </div>
              <div className="flex items-center text-gray-400 group-hover:text-teal-600 transition-colors duration-300">
                <span className="text-sm mr-1">Details</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Expandable section */}
          {showDetails === 'trend' && (
            <motion.div
              className="bg-gray-50 absolute bottom-0 p-4 border-t border-gray-100"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm text-gray-600">3-month history:</p>
              <div className="mt-3 flex items-end space-x-2">
                <div className="flex flex-col items-center">
                  <div className="h-16 w-6 bg-gray-200 rounded-t-sm overflow-hidden">
                    <div
                      className="bg-teal-500 w-full"
                      style={{ height: `${60}%`, marginTop: 'auto' }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">Mar</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-6 bg-gray-200 rounded-t-sm overflow-hidden">
                    <div
                      className="bg-teal-500 w-full"
                      style={{ height: `${80}%`, marginTop: 'auto' }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">Apr</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-6 bg-gray-200 rounded-t-sm overflow-hidden">
                    <div
                      className="bg-teal-500 w-full"
                      style={{ height: `${teamStats.targetCompletion}%`, marginTop: 'auto' }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">May</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};;