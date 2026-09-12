// ─── Granular Permissions Configuration ──────────────────────
// Central source of truth for all permissions in the system

export interface PermissionItem {
    key: string;
    label: string;
    type: 'view' | 'edit';
}

export interface PermissionGroup {
    groupLabel: string;
    permissions: PermissionItem[];
}

// ═══ Permissions Catalog ═══
export const PERMISSION_CATALOG: PermissionGroup[] = [
    {
        groupLabel: 'หลัก',
        permissions: [
            { key: 'dashboard.view', label: 'Dashboard — ดู', type: 'view' },
            { key: 'completed_projects.view', label: 'โครงการที่เสร็จสิ้น — ดู', type: 'view' },
            { key: 'committee.view', label: 'คณะกรรมการ — ดู', type: 'view' },
            { key: 'committee.edit', label: 'คณะกรรมการ — แก้ไข', type: 'edit' },
            { key: 'transliteration.view', label: 'คำทับศัพท์ — ดู', type: 'view' },
            { key: 'calendar.view', label: 'ปฏิทินกิจกรรม — ดู', type: 'view' },
        ],
    },
    {
        groupLabel: 'กลุ่มงานเลขานุการ',
        permissions: [
            { key: 'documents.view', label: 'เอกสาร — ดู/ขอเอกสาร', type: 'view' },
            { key: 'documents.edit', label: 'เอกสาร — จัดการ (เพิ่ม/ลบ/แก้ไข)', type: 'edit' },
            { key: 'registry.view', label: 'ทะเบียนเอกสาร — ดู', type: 'view' },
            { key: 'registry.edit', label: 'ทะเบียนเอกสาร — แก้ไข', type: 'edit' },
            { key: 'annual_projects.view', label: 'โครงการประจำปี — ดู', type: 'view' },
            { key: 'annual_projects.edit', label: 'โครงการประจำปี — แก้ไข', type: 'edit' },
            { key: 'projects.view', label: 'จัดการโครงการ — ดู', type: 'view' },
            { key: 'projects.edit', label: 'จัดการโครงการ — แก้ไข', type: 'edit' },
        ],
    },
    {
        groupLabel: 'กลุ่มงานการเงินและบัญชี',
        permissions: [
            { key: 'income_expense.view', label: 'รายรับ-รายจ่าย — ดู', type: 'view' },
            { key: 'income_expense.edit', label: 'รายรับ-รายจ่าย — แก้ไข', type: 'edit' },
        ],
    },
    {
        groupLabel: 'กลุ่มงานสมาชิก',
        permissions: [
            { key: 'members.view', label: 'ข้อมูลสมาชิก — ดู', type: 'view' },
            { key: 'members.edit', label: 'ข้อมูลสมาชิก — จัดการ', type: 'edit' },
        ],
    },
    {
        groupLabel: 'ระบบ',
        permissions: [
            { key: 'users.view', label: 'ผู้ใช้งาน — ดู', type: 'view' },
            { key: 'users.edit', label: 'ผู้ใช้งาน — จัดการ', type: 'edit' },
            { key: 'settings.view', label: 'ตั้งค่า — ดู', type: 'view' },
            { key: 'settings.edit', label: 'ตั้งค่า — แก้ไข', type: 'edit' },
            { key: 'activity_logs.view', label: 'ประวัติการใช้งาน — ดู', type: 'view' },
        ],
    },
];

// ═══ All permission keys (flat list) ═══
export const ALL_PERMISSION_KEYS: string[] = PERMISSION_CATALOG.flatMap(g => g.permissions.map(p => p.key));

// ═══ Role Presets ═══
export const ROLE_PRESETS: Record<string, string[]> = {
    SUPER_ADMIN: [...ALL_PERMISSION_KEYS], // All permissions
    ADMIN: [
        'dashboard.view',
        'completed_projects.view',
        'committee.view', 'committee.edit',
        'transliteration.view',
        'calendar.view',
        'documents.view', 'documents.edit',
        'registry.view', 'registry.edit',
        'annual_projects.view', 'annual_projects.edit',
        'projects.view', 'projects.edit',
        'income_expense.view', // View only
        'members.view', 'members.edit',
    ],
    FINANCE: [
        'dashboard.view',
        'completed_projects.view',
        'committee.view',
        'transliteration.view',
        'calendar.view',
        'documents.view',
        'registry.view',
        'annual_projects.view',
        'projects.view',
        'income_expense.view', 'income_expense.edit',
    ],
    VIEWER: [
        'dashboard.view',
        'completed_projects.view',
        'committee.view',
        'transliteration.view',
        'calendar.view',
        'documents.view',
        'registry.view',
        'annual_projects.view',
        'projects.view',
    ],
};

// ═══ Helper Functions ═══
export function getDefaultPermissions(role: string): string[] {
    return ROLE_PRESETS[role] || ROLE_PRESETS.VIEWER;
}

export function hasPermission(userPermissions: string[], permission: string): boolean {
    // SUPER_ADMIN check: if permissions include 'all' (legacy) or all keys
    if (userPermissions.includes('all')) return true;
    return userPermissions.includes(permission);
}
