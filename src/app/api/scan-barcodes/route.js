// app/api/scan-barcodes/route.js
import {NextResponse} from 'next/server';
import sharp from 'sharp';
import {unlinkSync, writeFileSync} from 'fs';
import path from 'path';
import {tmpdir} from 'os';
import {
    BinaryBitmap,
    BrowserMultiFormatReader,
    HTMLCanvasElementLuminanceSource,
    HybridBinarizer
} from "@zxing/library";
import {createCanvas, loadImage} from "canvas";
import Quagga from 'quagga';

// Alternative 1: Using zbar (recommended for production)
// async function scanWithZbar(imagePath) {
//     return new Promise((resolve, reject) => {
//         // const process = spawn('zbarimg', ['--quiet', '--raw', imagePath]);
//         // let output = '';
//         // let errorOutput = '';
//         //
//         // process.stdout.on('data', (data) => {
//         //     output += data.toString();
//         // });
//         //
//         // process.stderr.on('data', (data) => {
//         //     errorOutput += data.toString();
//         // });
//         //
//         // process.on('close', (code) => {
//         //     if (code === 0) {
//         //         const barcodes = output.trim().split('\n').filter(line => line.length > 0);
//         //         resolve(barcodes);
//         //     } else {
//         //         resolve([]); // No barcodes found, not an error
//         //     }
//         // });
//         //
//         // process.on('error', (error) => {
//         //     resolve([]); // Fallback to empty array if zbar not available
//         // });
//     });
// }

async function scanWithZbar(imagePath) {
    return new Promise(async (resolve, reject) => {
        try {
            const image = await loadImage(imagePath);
            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            const reader = new BrowserMultiFormatReader();
            const results = [];

            const decodeRegion = (x, y, width, height) => {
                const regionCanvas = createCanvas(width, height);
                const regionCtx = regionCanvas.getContext('2d');
                regionCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

                const source = new HTMLCanvasElementLuminanceSource(regionCanvas);
                const bitmap = new BinaryBitmap(new HybridBinarizer(source));

                try {
                    const result = reader.decode(bitmap);
                    const text = result.getText();
                    if (!results.includes(text)) {
                        results.push(text);
                    }
                } catch {
                    // No barcode in this region
                }
            };

            // Full image
            decodeRegion(0, 0, canvas.width, canvas.height);

            // Optional quadrants (better for detecting multiple barcodes)
            const halfW = Math.floor(canvas.width / 2);
            const halfH = Math.floor(canvas.height / 2);
            decodeRegion(0, 0, halfW, halfH); // top-left
            decodeRegion(halfW, 0, halfW, halfH); // top-right
            decodeRegion(0, halfH, halfW, halfH); // bottom-left
            decodeRegion(halfW, halfH, halfW, halfH); // bottom-right

            resolve(results);
        } catch (err) {
            console.error('Barcode scan error:', err.message);
            resolve([]); // Safe fallback
        }
    });
}

// Alternative 2: Using QuaggaJS on server (fallback)
async function scanWithNode(buffer) {
    try {
        // For server-side barcode detection, we'll use a simpler approach
        // This is a basic implementation - you might want to use a more robust library
        const Jimp = require('jimp').Jimp;
        const jsQR = require('jsqr');

        const image = await Jimp.read(buffer);
        const {width, height} = image.bitmap;
        const imageData = new Uint8ClampedArray(image.bitmap.data);

        const code = jsQR(imageData, width, height);
        return code ? [code.data] : [];
    } catch (error) {
        console.error('Node scanning error:', error);
        return [];
    }
}

export async function POST(request) {
    let tempFilePath = null;

    try {
        const formData = await request.formData();
        const image = formData.get('image');

        if (!image) {
            return NextResponse.json({error: 'No image provided'}, {status: 400});
        }

        // Convert image to buffer
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Process image with sharp for better barcode detection
        const processedImage = await sharp(buffer)
            .grayscale()
            .normalize()
            .sharpen()
            .png() // Convert to PNG for better compatibility
            .toBuffer();

        // Create temporary file for zbar
        tempFilePath = path.join(tmpdir(), `barcode_${Date.now()}.png`);
        writeFileSync(tempFilePath, processedImage);
        const result = (await readBarcode(tempFilePath)) ?? [];

        let serials = result.map(e => e.code).filter(e => e.length > 0)

        // If zbar didn't work, try alternative methods
        // if (serials.length === 0) {
        //     try {
        //         serials = await scanWithNode(processedImage);
        //     } catch (error) {
        //         console.log('Alternative scanning failed:', error);
        //     }
        // }
        // if (serials.length === 0) {
        //     const regions = [
        //         {top: 0, left: 0, width: 1, height: 0.5}, // Top half
        //         {top: 0.5, left: 0, width: 1, height: 0.5}, // Bottom half
        //         {top: 0, left: 0, width: 0.5, height: 1}, // Left half
        //         {top: 0, left: 0.5, width: 0.5, height: 1}, // Right half
        //     ];
        //
        //     for (const region of regions) {
        //         try {
        //             const metadata = await sharp(buffer).metadata();
        //             const {width, height} = metadata;
        //
        //             const regionBuffer = await sharp(buffer)
        //                 .extract({
        //                     left: Math.floor(region.left * width),
        //                     top: Math.floor(region.top * height),
        //                     width: Math.floor(region.width * width),
        //                     height: Math.floor(region.height * height)
        //                 })
        //                 .grayscale()
        //                 .normalize()
        //                 .sharpen()
        //                 .png()
        //                 .toBuffer();
        //
        //             const regionPath = path.join(tmpdir(), `region_${Date.now()}.png`);
        //             writeFileSync(regionPath, regionBuffer);
        //
        //             try {
        //                 const regionSerials = await scanWithZbar(regionPath);
        //                 serials.push(...regionSerials);
        //                 unlinkSync(regionPath);
        //             } catch (regionError) {
        //                 try {
        //                     unlinkSync(regionPath);
        //                 } catch {
        //                 }
        //                 continue;
        //             }
        //         } catch (regionError) {
        //             continue;
        //         }
        //     }
        // }

        const uniqueSerials = [...new Set(serials.map(s => s.trim()).filter(s => s.length > 0))];

        return NextResponse.json({
            serials: uniqueSerials,
            count: uniqueSerials.length
        });

    } catch (error) {
        console.error('Error processing image:', error);
        return NextResponse.json(
            {error: 'Failed to process image'},
            {status: 500}
        );
    } finally {
        // Clean up temporary file
        if (tempFilePath) {
            try {
                unlinkSync(tempFilePath);
            } catch (error) {
                console.log('Failed to clean up temp file:', error);
            }
        }
    }
}

function readBarcode(imagePath) {
    return new Promise((resolve, reject) => {
        const foundCodes = [];

        Quagga.decodeSingle({
            src: imagePath,
            numOfWorkers: 0, // Important for server-side
            inputStream: {
                size: 800 // Adjust based on your image size
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "code_39_reader",
                    "code_39_vin_reader",
                    "codabar_reader",
                    "upc_reader",
                    "upc_e_reader",
                    "i2of5_reader"
                ]
            }
        }, (result) => {
            if (result && result.codeResult) {
                foundCodes.push({
                    code: result.codeResult.code,
                    format: result.codeResult.format,
                    confidence: result.codeResult.decodedCodes[result.codeResult.decodedCodes.length - 1].confidence || 0
                });
            }

            // For multiple codes, we need to use a different approach
            // The above only finds the first/best match
            resolve(foundCodes.length > 0 ? foundCodes : null);
        });
    });
}

