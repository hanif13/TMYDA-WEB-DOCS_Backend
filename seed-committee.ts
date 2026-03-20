
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter: adapter as any });

const committeeData = [
    {
        departmentId: 'admin',
        members: [
            { name: 'อุสมาน เจะอุมา', position: 'ผู้อำนวยการ', phoneNumber: '0895135667', occupation: 'ทำหนังสือ' },
            { name: 'รีดูวัล วาฮับ', position: 'งานสื่อองค์กร', phoneNumber: '0946705557', occupation: 'ไวท์แชนแนล' },
            { name: 'อุสมานร์ เทศอาเส็น', position: 'รองผู้อำนวยการ', phoneNumber: '0980159738', occupation: 'อาจารย์' },
            { name: 'อิลญาซ อาแวนิ', position: 'กรรมการ', phoneNumber: '0828307049', occupation: 'คุณครู' },
            { name: 'ฮาฟิซต์ เบ็ญหาวัน', position: 'งานสื่อองค์กร', phoneNumber: '0862915715', occupation: 'นักออกแบบอิสระ' },
            { name: 'อาคีรัฐ มะยูโซะ', position: 'งานสนับสนุนและติดตาม', phoneNumber: '0660719460', occupation: 'ลูกจ้าง' },
            { name: 'อิสมานดี เหมตระกูลวงศ์', position: 'รองฯและเหรัญญิก งานการเงิน', phoneNumber: '0831909572', occupation: 'ลูกจ้าง เทศบาลฯ' },
            { name: 'ฟิตตรี มะดาโอะ', position: 'หัวหน้างานสมาชิก', phoneNumber: '0896591129', occupation: 'รับราชการ' },
            { name: 'นครา ยะโกะ', position: 'งานสื่อองค์กร', phoneNumber: '0935742827', occupation: 'นักออกแบบกราฟิก' },
            { name: 'ดิศร์ ตอเล็บ', position: 'หัวหน้าการเงิน', phoneNumber: '0863121506', occupation: 'ธุรกิจส่วนตัว, สหกรณ์ , แซะห์' },
            { name: 'แวมูฮัมหมัดซาบรี แวยะโก๊ะ', position: 'งานวิชาการองค์กร', phoneNumber: '0802866300', occupation: 'ทำหนังสือ' },
            { name: 'อ.มูฮัมหมัดคอลีล บินอะฮ์หมัด', position: 'งานสมาชิก', phoneNumber: '0876308352', occupation: 'abumuhib87' }
        ]
    },
    {
        departmentId: 'family',
        members: [
            { name: 'นายมัรวาน อะฮ์หมัดบัสลาน', position: 'ผู้จัดการครอบครัว', phoneNumber: '0944973406' },
            { name: 'นายไซยิดฮารูน อัลอิดรุส', position: 'เลขานุการและการเงิน', phoneNumber: '092-904-2774' },
            { name: 'อ.มูฮัมหมัด เซะ', position: 'หัวหน้าฝ่ายวิชาการและตัรบียะห์', phoneNumber: '063-913-3934' },
            { name: 'อ.นาวาวีย์ วงศ์มุดา', position: 'กรรมการฝ่ายวิชาการ (จัดอบรมพิเศษ)', phoneNumber: '081-455-9067' },
            { name: 'นายอัยยูบ มะแซ', position: 'หัวหน้าฝ่ายสื่อ', phoneNumber: '084-862-0289' },
            { name: 'นายดิศร์ ตอเล็บ', position: 'หัวหน้าสาขา กรุงเทพมหานคร', phoneNumber: '086-312-1506' },
            { name: 'นายอัซฮา อดุลย์เราะห์มาน', position: 'หัวหน้าสาขา นราธิวาส', phoneNumber: '086-483-4587' },
            { name: 'นายอิลฮัม บุญญามีน', position: 'หัวหน้าสาขา ปัตตานี', phoneNumber: '093-651-1133' },
            { name: 'อ.มูฮัมหมัดคอลีล บินอะฮ์หมัด', position: 'หัวหน้าสาขา สงขลา', phoneNumber: '087-630-8352' },
            { name: 'นายอัมรี มะ', position: 'หัวหน้าสาขา ยะลา', phoneNumber: '085-907-7927' },
            { name: 'นายยุทธพงศ์ อาหน่าย', position: 'หัวหน้าสาขา สตูล', phoneNumber: '065-034-8081' },
            { name: 'นายฟาอีสธ์ เชื้อสมั่น', position: 'หัวหน้าสาขา ภูเก็ต', phoneNumber: '089-872-4660' },
            { name: 'นายพชร พงศ์ยี่ล่า', position: 'หัวหน้าสาขา นครศรีธรรมราช', phoneNumber: '096-635-9025' }
        ]
    },
    {
        departmentId: 'tmyda',
        members: [
            { name: 'นายมูฮัซซัน สาระโสภณ', position: 'นายกสมาคม', phoneNumber: '0988003536', occupation: 'นิสิต' },
            { name: 'นายฮนีฟ ต่วนมีเด่น', position: 'อุปนายกและผู้อำนวยการสำนักสานสัมพันธ์', phoneNumber: '0910463361', occupation: 'นักศึกษา' },
            { name: 'นายนครินทร์ ทองคำ', position: 'ผู้อำนวยการสำนักเลขาและการจัดการ', phoneNumber: '0962858554', occupation: 'นักเรียน' },
            { name: 'นายมุอ๊าซ หมัดซาและ', position: 'ผู้อำนวนการสำนักบริหารงบประมาณ', phoneNumber: '0657706004', occupation: 'นักศึกษา' },
            { name: 'นายหะนีซ มามะ', position: 'ผู้อำนวยการสำนักสื่อและะประชาสัมพันธ์', phoneNumber: '0980873083', occupation: 'นักศึกษา' },
            { name: 'นายนภัส อับดุลลอสุวรรณ', position: 'ผู้อำนวยการสำนักบริหารโครงการ', phoneNumber: '0658277010', occupation: 'นักศึกษา' },
            { name: 'นายชะฮีด อารีฟ', position: 'ผู้อำนวยการสำนักวิชาการและตัรบียะฮ.', phoneNumber: '0610732229', occupation: 'นักศึกษา' }
        ]
    },
    {
        departmentId: 'women',
        members: [
            { name: 'นางสาวซินนี โอรามหลง', position: 'ประธานกิจการสตรี', phoneNumber: '0615527719', occupation: 'นักศึกษา' },
            { name: 'นางสาวมัรญาน ดอเล๊าะ', position: 'รองประธานกิจการสตรี', phoneNumber: '0824190389', occupation: 'นักศึกษา' },
            { name: 'นางสาวอามานีนา เจะหะ', position: 'เลขานุการ', phoneNumber: '0973879814', occupation: 'นักศึกษา' },
            { name: 'นางสาวดานานีร ละกานัน', position: 'เหรัญญิก', phoneNumber: '0992766137', occupation: 'นักศึกษา' },
            { name: 'นางสาวรุฮ์มา มะเกะ', position: 'หัวหน้าฝ่ายวิชาการ', phoneNumber: '0990395191', occupation: 'นักศึกษา' },
            { name: 'นางสาวซุลฮา สะอะ', position: 'หัวหน้าฝ่ายกิจกรรม', phoneNumber: '0631948363', occupation: 'นักเรียน' },
            { name: 'นางสาวมัรฮามา จิเหม', position: 'หัวหน้าฝ่ายสื่อและประชาสัมพันธ์', phoneNumber: '0992855487', occupation: 'นักศึกษา' },
            { name: 'นางสาวโรศิลา เตาวะโต', position: 'หัวหน้าฝ่ายทรัพยากรบุคคล', phoneNumber: '0623963072', occupation: 'นักศึกษา' },
            { name: 'นางสาวอาดีลา หอมหวล', position: 'กรรมการฝ่ายวิชาการ', phoneNumber: '0902233402', occupation: 'นักเรียน' },
            { name: 'นางสาวรอยยาน หะแว', position: 'กรรมการฝ่ายวิชาการ', phoneNumber: '0988670267', occupation: 'นักเรียน' },
            { name: 'นางสาวกัยย์ฟาญ เต๊ะ', position: 'กรรมการฝ่ายวิชาการ', phoneNumber: '0801472061', occupation: 'นักเรียน' },
            { name: 'นางสาวดาอาน ยูโซะ', position: 'กรรมการฝ่ายกิจกรรม', phoneNumber: '0616042192', occupation: 'นักเรียน' },
            { name: 'นางสาวซีรีน สาเมาะ', position: 'กรรมการฝ่ายกิจกรรม', phoneNumber: '0931879732', occupation: 'นักเรียน' },
            { name: 'นางสาวนูรฮีดาญะห์ มามะ', position: 'กรรมการฝ่ายสื่อและประชาสัมพันธ์', phoneNumber: '0808907998', occupation: 'นักเรียน' },
            { name: 'นางสาววัสมีย์ แวเด็ง', position: 'กรรมการฝ่ายสื่อและประชาสัมพันธ์', phoneNumber: '0800803981', occupation: 'นักเรียน' },
            { name: 'นางสาวกัญญาวดี แซะอาลำ', position: 'กรรมการฝ่ายทรัพยากรบุคคล', phoneNumber: '0618276590', occupation: 'นักศึกษา' },
            { name: 'นางสาวนูรีหย๊ะ รัตยูซัต', position: 'กรรมการฝ่ายทรัพยากรบุคคล', phoneNumber: '0611459836', occupation: 'นักศึกษา' }
        ]
    }
];

async function main() {
    console.log('Seeding committee data...');
    
    // Check departments
    const depts = await prisma.department.findMany();
    console.log('Available departments:', depts.map(d => d.id));

    // Clear existing committee members
    await prisma.committeeMember.deleteMany({});
    
    for (const group of committeeData) {
        const deptExists = depts.find(d => d.id === group.departmentId);
        if (!deptExists) {
            console.warn(`Department ${group.departmentId} not found, skipping...`);
            continue;
        }
        
        console.log(`Processing department: ${group.departmentId}`);
        for (let i = 0; i < group.members.length; i++) {
            const member = group.members[i];
            await prisma.committeeMember.create({
                data: {
                    ...member,
                    departmentId: group.departmentId,
                    order: i
                }
            });
        }
    }
    
    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
