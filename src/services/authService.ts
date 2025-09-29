export type UserRole = 'Admin' | 'Staff' | 'User'

type MockUser = {
	email: string
	password: string
	role: UserRole
}

const USERS: MockUser[] = [
	{ email: 'admin@test.com', password: '123456', role: 'Admin' },
	{ email: 'staff@test.com', password: '123456', role: 'Staff' },
	{ email: 'user@test.com', password: '123456', role: 'User' },
]

export async function fakeLogin(identifier: string, password: string): Promise<UserRole> {
	// simulate latency
	await new Promise((r) => setTimeout(r, 300))
	const found = USERS.find(u => u.email.toLowerCase() === identifier.toLowerCase() && u.password === password)
	if (!found) throw new Error('Invalid credentials')
	localStorage.setItem('role', found.role)
	return found.role
}

export function getStoredRole(): UserRole | null {
	const r = localStorage.getItem('role') as UserRole | null
	return r ?? null
}

export function logout(): void {
	localStorage.removeItem('role')
}


