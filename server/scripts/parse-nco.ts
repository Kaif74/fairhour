import * as fs from 'fs';
import * as path from 'path';

// Dynamic import for pdf-parse (needs to be installed separately)
async function parsePDF(filePath: string): Promise<string> {
    try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Error: pdf-parse not installed. Run: npm install pdf-parse');
        process.exit(1);
    }
}

interface ExtractedOccupation {
    nco_code: string;
    title: string;
    major_group: string;
    sub_major_group?: string;
    minor_group?: string;
    unit_group?: string;
    description: string;
}

// NCO Major Group mapping
const MAJOR_GROUPS: Record<string, string> = {
    '0': 'Armed Forces Occupations',
    '1': 'Managers',
    '2': 'Professionals',
    '3': 'Technicians and Associate Professionals',
    '4': 'Clerical Support Workers',
    '5': 'Service and Sales Workers',
    '6': 'Skilled Agricultural Workers',
    '7': 'Craft and Related Trades Workers',
    '8': 'Plant and Machine Operators',
    '9': 'Elementary Occupations',
};

// Skill level mapping based on NCO major group
function getSkillLevel(majorGroupCode: string): number {
    switch (majorGroupCode) {
        case '1':
        case '2':
            return 4; // Professional/specialist
        case '3':
            return 3; // Technical
        case '0':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
            return 2; // Skilled trades/manual
        case '9':
            return 1; // Elementary
        default:
            return 1;
    }
}

function getBaseMultiplier(skillLevel: number): number {
    switch (skillLevel) {
        case 4:
            return 1.8;
        case 3:
            return 1.5;
        case 2:
            return 1.2;
        case 1:
        default:
            return 1.0;
    }
}

/**
 * Parse extracted PDF text to find occupation codes and titles.
 * This is a best-effort parser — NCO PDFs have complex formatting.
 */
function extractOccupations(text: string): ExtractedOccupation[] {
    const occupations: ExtractedOccupation[] = [];
    const lines = text.split('\n');

    // Pattern: 4-digit NCO code followed by occupation title
    // Examples: "2512 Software Developer", "6113 Gardener"
    const codePattern = /^(\d{4})\s+(.+)$/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const match = line.match(codePattern);

        if (match) {
            const code = match[1];
            const title = match[2].trim();
            const majorGroupCode = code[0];
            const majorGroup = MAJOR_GROUPS[majorGroupCode] || 'Unknown';

            // Try to get description from following lines
            let description = '';
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const nextLine = lines[j].trim();
                if (nextLine && !nextLine.match(/^\d{4}\s/) && nextLine.length > 20) {
                    description = nextLine;
                    break;
                }
            }

            const skillLevel = getSkillLevel(majorGroupCode);

            occupations.push({
                nco_code: code,
                title,
                major_group: majorGroup,
                description: description || `${title} in the ${majorGroup} occupational group.`,
            });
        }
    }

    return occupations;
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: npx ts-node scripts/parse-nco.ts <pdf-path> [output-path]');
        console.log('Example: npx ts-node scripts/parse-nco.ts ../NCO/National_Classification_of_Occupations_Vol_I-2015.pdf');
        process.exit(1);
    }

    const pdfPath = path.resolve(args[0]);
    const outputPath = args[1] || 'nco-occupations.json';

    if (!fs.existsSync(pdfPath)) {
        console.error(`File not found: ${pdfPath}`);
        process.exit(1);
    }

    console.log(`📄 Parsing NCO PDF: ${pdfPath}`);
    const text = await parsePDF(pdfPath);
    console.log(`📝 Extracted ${text.length} characters of text`);

    const occupations = extractOccupations(text);
    console.log(`🔍 Found ${occupations.length} occupation entries`);

    // Add skill level and multiplier to output
    const enriched = occupations.map((occ) => {
        const skillLevel = getSkillLevel(occ.nco_code[0]);
        return {
            ...occ,
            skill_level: skillLevel,
            base_multiplier: getBaseMultiplier(skillLevel),
        };
    });

    fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2), 'utf-8');
    console.log(`✅ Wrote ${enriched.length} occupations to ${outputPath}`);
}

main().catch(console.error);
