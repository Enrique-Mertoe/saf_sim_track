import React from "react";

// @ts-ignore
const StepperComponent = ({steps, activeStep}) => (
    <div className="w-full">
        <div className="flex justify-between">
            {
                //@ts-ignore
                steps.map((step, index) => (
                <div
                    key={index}
                    className={`flex items-center flex-col ${index <= activeStep ? 'text-green-600' : 'text-gray-400'}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        index < activeStep ? 'bg-green-600 text-white' :
                            index === activeStep ? 'border-2 border-green-600 text-green-600' :
                                'border-2 border-gray-300 text-gray-400'
                    }`}>
                        {index < activeStep ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.3334 4L6.00008 11.3333L2.66675 8" stroke="currentColor" strokeWidth="2"
                                      strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        ) : (
                            index + 1
                        )}
                    </div>
                    <span className="text-xs font-medium">{steps[index]}</span>
                </div>
            ))}
        </div>

        <div className="relative mt-2">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200"></div>
            <div
                className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-600 transition-all"
                style={{width: `${(activeStep / (steps.length - 1)) * 100}%`}}
            ></div>
        </div>
    </div>
);

// @ts-ignore
export const Stepper = ({steps, activeStep}) => {
    return <StepperComponent steps={steps} activeStep={activeStep}/>;
};

// @ts-ignore
export const Step = ({children, isActive}) => {
    if (!isActive) return null;
    return <div className="mt-6">{children}</div>;
};