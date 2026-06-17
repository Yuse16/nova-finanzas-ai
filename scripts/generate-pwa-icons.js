const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises'); // Usar fs/promises para async/await

const SVG_INPUT = path.join(__dirname, '../public/nova-glass-premium.svg');
const OUTPUT_DIR = path.join(__dirname, '../public');

const PNG_SIZES = [72, 96, 128, 144, 152, 192, 256, 384, 512];
const FAVICON_SIZES = [16, 32, 48];

async function generateIcons() {
    try {
        console.log('Generando iconos PWA...');

        // Asegurarse de que el SVG de origen existe
        await fs.access(SVG_INPUT);

        // Generar PNGs
        for (const size of PNG_SIZES) {
            const pngOutput = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
            console.log(`Generando ${pngOutput}...`);
            await sharp(SVG_INPUT)
                .resize(size, size)
                .toFile(pngOutput);
        }

        // Generar apple-touch-icon.png
        const appleTouchIconOutput = path.join(OUTPUT_DIR, 'apple-touch-icon.png');
        console.log(`Generando ${appleTouchIconOutput}...`);
        await sharp(SVG_INPUT)
            .resize(180, 180)
            .toFile(appleTouchIconOutput);

        // Generar favicon.ico
        console.log('Generando favicon.ico...');
        
        await sharp(SVG_INPUT)
             .resize(16,16)
             .toFile(path.join(OUTPUT_DIR, 'favicon.ico')); // Simplificado: genera solo 16x16 y lo guarda como ico

        console.log('Generación de iconos completada.');

    } catch (error) {
        console.error('Error al generar iconos:', error);
        process.exit(1);
    }
}

generateIcons();

