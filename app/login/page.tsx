import Link from 'next/link'

export default function LoginPage(){
  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">লগইন করুন</h2>
      <form action="/api/auth/login" method="post" className="space-y-3">
        <div>
          <label className="block text-sm">ইমেইল বা ফোন</label>
          <input name="identifier" className="mt-1 w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm">পাসওয়ার্ড</label>
          <input name="password" type="password" className="mt-1 w-full border rounded-md p-2" />
        </div>
        <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold">লগইন</button>
      </form>
      <p className="mt-4 text-sm">নতুন ব্যবহারকারী? <Link href="/register" className="text-primary">রেজিস্টার</Link></p>
    </div>
  )
}
