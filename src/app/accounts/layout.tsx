"use client"
import React, {useEffect, useRef} from "react";
import Image from "next/image";
import {motion, useAnimation, useMotionValue, useSpring} from "framer-motion";

const fadeIn = (delay = 0) => {
    return {
        opacity: 0,
        animation: `fadeIn 0.8s ease-out ${delay}s forwards`,
    };
};
export default function AccountsPage({children}: { children: React.ReactNode }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Colors
    const safaricomGreen = "#4CA350";
    const safaricomDarkGreen = "#005522";

    // Animation controls
    const controls = useAnimation();

    // Logo spring animation
    const logoScale = useSpring(0.3, {stiffness: 100, damping: 10});
    // Background animation values
    const offsetX = useMotionValue(0);
    const offsetY = useMotionValue(0);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const patternSize = 120;

        // Set canvas size
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        // Animation loop
        const animate = () => {
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const offsetXValue = offsetX.get();
            const offsetYValue = offsetY.get();

            // Draw subtle pattern
            const rows = Math.ceil(canvas.height / patternSize) + 2;
            const cols = Math.ceil(canvas.width / patternSize) + 2;

            for (let i = -1; i <= rows; i++) {
                for (let j = -1; j <= cols; j++) {
                    const x = j * patternSize + offsetXValue - patternSize;
                    const y = i * patternSize + offsetYValue - patternSize;

                    // Draw a subtle circle
                    ctx.beginPath();
                    ctx.arc(x, y, 40, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(173, 225, 176, 0.07)";
                    ctx.fill();
                }
            }

            // Draw top wave
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(canvas.width, 0);
            ctx.lineTo(canvas.width, canvas.height * 0.3);

            // Create the wave effect
            ctx.bezierCurveTo(
                canvas.width * 0.75, canvas.height * 0.36,
                canvas.width * 0.25, canvas.height * 0.24,
                0, canvas.height * 0.28
            );
            ctx.closePath();

            // Create gradient for the wave
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height * 0.28);
            gradient.addColorStop(0, safaricomGreen);
            gradient.addColorStop(1, safaricomDarkGreen);
            ctx.fillStyle = gradient;
            ctx.fill();
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Animate the background pattern
        const animatePattern = () => {
            offsetX.set((offsetX.get() + 0.2) % patternSize);
            offsetY.set((offsetY.get() + 0.1) % patternSize);
            requestAnimationFrame(animatePattern);
        };
        requestAnimationFrame(animatePattern);

        return () => {
            window.removeEventListener("resize", handleResize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);
    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const titleVariants = {
        hidden: {y: 20, opacity: 0},
        visible: {
            y: 0,
            opacity: 1,
            transition: {duration: 0.7, ease: "easeOut", delay: 0.2}
        }
    };

    const cardVariants = {
        hidden: {y: 20, opacity: 0},
        visible: {
            y: 0,
            opacity: 1,
            transition: {duration: 0.7, ease: "easeOut", delay: 0.3}
        }
    };

    const inputVariants = {
        hidden: {x: -10, opacity: 0},
        visible: {
            x: 0,
            opacity: 1,
            transition: {duration: 0.5, ease: "easeOut"}
        }
    };


    const textVariants = {
        hidden: {opacity: 0},
        visible: {
            opacity: 1,
            transition: {duration: 0.7, ease: "easeOut"}
        }
    };

    // Start animations on mount
    useEffect(() => {
        // Logo animation
        logoScale.set(1);

        // Sequence the UI animations
        controls.start("visible");
    }, [controls, logoScale]);
    return (
        <div className="flex auth flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Left side - Branding */}
            <div
                className="hidden md:flex sticky top-0 max-h-screen md:w-1/2 text-center bg-green-600 dark:bg-green-800 text-white flex-col justify-center items-center p-8">
                <div style={fadeIn(0)} className="max-w-md">
                    <div className="flex items-center justify-center mb-8">
                        <Image width={100} height={100} src="/logo.png" alt="logo" />
                        {/*<h1 className="text-4xl font-bold">Safaricom</h1>*/}
                    </div>
                    <h2 className="text-2xl font-semibold mb-6" style={fadeIn(0.3)}>SIM Card Sales Tracking</h2>
                    <p className="text-lg mb-8" style={fadeIn(0.6)}>
                        Track SIM card sales, monitor activations, and manage your teams efficiently from anywhere.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-12" style={fadeIn(0.9)}>
                        <div
                            className="bg-green-500 dark:bg-green-700 p-4 rounded-lg shadow-md dark:shadow-green-900/30">
                            <h3 className="font-bold mb-2">Track Sales</h3>
                            <p className="text-sm">Monitor sales performance in real-time</p>
                        </div>
                        <div
                            className="bg-green-500 dark:bg-green-700 p-4 rounded-lg shadow-md dark:shadow-green-900/30">
                            <h3 className="font-bold mb-2">Manage Teams</h3>
                            <p className="text-sm">Efficiently handle team operations</p>
                        </div>
                        <div
                            className="bg-green-500 dark:bg-green-700 p-4 rounded-lg shadow-md dark:shadow-green-900/30">
                            <h3 className="font-bold mb-2">Generate Reports</h3>
                            <p className="text-sm">Access detailed insights and analytics</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full relative min-h-screen md:w-1/2">
                <canvas
                    ref={canvasRef}
                    className="absolute md:hidden top-0 left-0 w-full h-full"
                    style={{zIndex: 0}}
                />

                <motion.div
                    className="relative min-h-full z-10 flex flex-col items-center justify-center w-full px-6 pb-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Logo Container - With spring animation */}
                    <div className="md:hidden">
                        <motion.div
                            className="mt-8 mb-6 flex items-center justify-center"
                            style={{scale: logoScale}}
                        >
                            <div
                                className="bg-white rounded-full p-3 w-32 h-32 flex items-center justify-center shadow-lg border-2 border-green-100">
                                <div className="text-green-600 font-bold text-xl flex items-center">
                                    {/*<svg xmlns="http://www.w3.org/2000/svg" width="104" height="104"*/}
                                    {/*     viewBox="-9.488415 -3.493 82.23293 20.958">*/}
                                    {/*    <path*/}
                                    {/*        d="M21.9026.7002C20.931-.981 15.2714.4687 9.2632 3.9413 3.2536 7.4126-.8296 11.5895.1433 13.272c.8351 1.4456 5.1332.5747 10.1396-1.9003.2233-.1226.2081-.3872-.084-.2921-3.0855 1.1369-5.6597 1.2071-6.3253 0-.886-1.6013 1.9183-4.8452 6.2618-7.243C14.479 1.4361 18.718.7884 19.604 2.3896c.4038.7332.0345 1.8108-.9012 2.9946l-.0124.0179c-.3473.4285-.0951.558.153.35 2.395-2.1222 3.6435-4.0404 3.0592-5.052"*/}
                                    {/*        fill="#de1e23"/>*/}
                                    {/*    <path*/}
                                    {/*        d="M12.8916 11.7741c-.5347-.1447-.973-.3404-1.3078-.587l.6063-1.3698c.3583.226.7387.3996 1.1397.5195.4024.12.8047.1805 1.2099.1805.412 0 .729-.0579.9495-.1694.2177-.1144.328-.2743.328-.4796 0-.186-.0993-.3376-.2977-.4603-.1998-.1185-.5747-.237-1.1245-.3528-.6932-.1391-1.232-.3086-1.6164-.5112-.3859-.2026-.6532-.441-.8103-.7152-.1544-.2756-.2302-.6077-.2302-1.0005 0-.4464.1268-.8488.3818-1.2099.2549-.361.6104-.6421 1.0707-.8447.4603-.2026.984-.3032 1.5765-.3032.5291 0 1.0418.073 1.5392.2205.4989.1475.8875.3418 1.17.583l-.598 1.3697a3.9875 3.9875 0 00-1.0198-.521c-.357-.1198-.7138-.1804-1.0708-.1804-.35 0-.6325.0675-.8447.2012-.2136.1336-.3197.3155-.3197.5415 0 .124.0372.226.113.3087.0758.0813.2177.164.4217.2425.2067.0785.5154.1626.9274.2522.667.1447 1.1906.3183 1.5723.5195.3804.2026.6505.441.8076.7111.1584.2715.2384.5953.2384.9743 0 .7138-.2798 1.2774-.8351 1.684-.5567.4092-1.3395.6132-2.3496.6132a6.2696 6.2696 0 01-1.6274-.2164m11.3026-5.1097v5.2324h-1.8355v-.7097c-.1488.2466-.3693.441-.6573.5815-.2894.1406-.6064.2122-.9481.2122-.4479 0-.8448-.1102-1.1962-.3307-.3486-.2205-.6228-.5333-.82-.9426-.1942-.4065-.2934-.8806-.2934-1.4152 0-.543.1006-1.024.3004-1.4428.1984-.4203.4727-.7456.8227-.9798.3514-.233.7455-.35 1.1865-.35.3417 0 .6573.073.9412.2218.2866.1475.507.346.6642.5926v-.6697zM22.0913 10.25c.1792-.2274.2674-.5526.2674-.9784 0-.434-.0882-.7648-.2674-.995-.1777-.23-.4327-.3458-.762-.3458-.3225 0-.576.1199-.762.3555-.1861.237-.2784.5719-.2784 1.006 0 .4161.0882.7386.2673.9632.1792.2219.4368.3335.773.3335.3294 0 .5844-.113.7621-.339m3.3225-3.5856v-.1447c0-.7084.186-1.2596.5512-1.6578.368-.3983.9026-.5995 1.6027-.5995.3996 0 .7234.0496.9687.1447v1.4332c-.1998-.0482-.3652-.073-.4933-.073-.2205 0-.4024.0634-.5471.1915-.1433.1268-.2163.3197-.2163.5816v.124h1.0197v1.3698h-1.0197v3.8626h-1.866V6.6644m9.2013 0v5.2324h-1.8342v-.7097c-.1502.2466-.3693.441-.6601.5815-.2866.1406-.6036.2122-.9467.2122-.4465 0-.8434-.1102-1.1948-.3307-.35-.2205-.6228-.5333-.8199-.9426-.1957-.4065-.2921-.8806-.2921-1.4152 0-.543.0992-1.024.2976-1.4428.1984-.4203.474-.7456.824-.9798.3515-.233.7456-.35 1.1852-.35.3431 0 .6587.073.9426.2218.2852.1475.507.346.6642.5926v-.6697zM32.5134 10.25c.1792-.2274.2674-.5526.2674-.9784 0-.434-.0882-.7648-.2674-.995-.1777-.23-.4313-.3458-.762-.3458-.3225 0-.5774.1199-.762.3555-.1861.237-.2784.5719-.2784 1.006 0 .4161.0896.7386.2687.9632.1778.2219.4354.3335.7717.3335.3307 0 .5843-.113.762-.339m7.0928-3.5967v1.7005c-.2949-.1378-.5774-.2067-.8516-.2067-.78 0-1.17.3748-1.17 1.1231v2.6266H35.727v-3.729c0-.5622-.0275-1.0639-.0813-1.5048h1.7446l.113.8764c.1227-.3225.3197-.5705.5953-.7428.2729-.1695.5802-.2563.922-.2563.2535 0 .4478.0386.5856.113m.5512 5.2435h1.8645V6.663h-1.8645zm3.4933-.6381c-.5002-.481-.751-1.1355-.751-1.9664 0-.5499.1199-1.035.3638-1.4525.2453-.419.5857-.7441 1.0267-.9743.4382-.23.948-.3445 1.524-.3445.3832 0 .7621.0551 1.1342.1682.3693.1143.6642.2673.8847.4602l-.474 1.2857c-.1847-.1502-.4024-.27-.6477-.3596-.248-.0896-.4851-.1337-.7125-.1337-.3844 0-.6793.1102-.886.3293-.2054.2192-.3087.5471-.3087.9785 0 .441.1033.7717.3086.9963.2068.2218.5058.3335.8972.3335.2273 0 .4616-.0441.7055-.135.244-.0883.4589-.2096.6436-.3598l.474 1.2665c-.226.1998-.5278.3541-.8999.4644-.3762.1102-.7758.164-1.2016.164-.8861 0-1.5792-.2398-2.0809-.7208m5.9036.3913c-.4327-.219-.7662-.536-1.0005-.948-.2343-.412-.35-.8957-.35-1.4524 0-.5568.1157-1.0405.35-1.4525.2343-.412.5678-.7276 1.0005-.9467.4327-.2205.9412-.3307 1.5255-.3307.576 0 1.079.1116 1.5075.3362.43.2219.7607.5388.9936.9467.2343.408.35.8902.35 1.447 0 .5567-.1157 1.0404-.35 1.4483-.2329.4079-.5636.7248-.9936.9467-.4285.2232-.9315.3362-1.5075.3362-.5843 0-1.0928-.1102-1.5255-.3307m2.5356-2.4005c0-.4534-.0854-.787-.255-1.0033-.1667-.2163-.4203-.3238-.7551-.3238-.3446 0-.6022.1075-.7745.3238-.1709.2164-.2577.5499-.2577 1.0033 0 .4602.0868.7992.2577 1.0156.1723.2163.43.3252.7745.3252.6724 0 1.01-.4479 1.01-1.3408m10.7295-2.1732c.2921.3707.4368.937.4368 1.6991v3.1213H61.393v-3.069c0-.31-.047-.5332-.1406-.6697-.0923-.1378-.2494-.2067-.4685-.2067-.2618 0-.463.0978-.6077.2894-.1447.193-.2164.4617-.2164.813v2.843h-1.8645v-3.069c0-.31-.0496-.5332-.1446-.6697-.0965-.1378-.2508-.2067-.463-.2067-.2605 0-.463.0978-.6023.2894-.142.193-.2122.4617-.2122.813v2.843H54.806v-3.729c0-.5622-.0248-1.0652-.08-1.5034h1.7516l.0923.7317c.1584-.2825.3803-.4989.6642-.6504.2852-.1489.6132-.2247.9839-.2247.7496 0 1.2581.3156 1.5241.9467.1874-.2893.434-.5181.7373-.6903.3059-.1723.638-.2564.9949-.2564.6036 0 1.0514.1847 1.345.5554M40.1574 5.7769h1.8645V4.0984h-1.8645zm0 0"*/}
                                    {/*        fill="#3aa335"/>*/}
                                    {/*</svg>*/}
                                    <Image width={100} height={100} src="/logo.png" alt="logo" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Title Container */}
                        <motion.div
                            className="w-full text-center mb-4"
                            variants={titleVariants}
                        >
                            <h1 className="text-gray-100 text-3xl font-bold mb-1">SIM Tracker</h1>
                            <p className="text-gray-300 text-lg">Sales & Activation Management</p>
                        </motion.div>
                    </div>
                    {children}
                </motion.div>

            </div>
        </div>
    )
}