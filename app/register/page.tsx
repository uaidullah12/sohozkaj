import Link from 'next/link'

export default function RegisterPage(){
  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">রেজিস্টার</h2>
      <form action="/api/auth/register" method="post" className="space-y-3">
        <div>
          <label className="block text-sm">নাম</label>
          <input name="name" className="mt-1 w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm">ইমেইল</label>
          <input name="email" type="email" className="mt-1 w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm">পাসওয়ার্ড</label>
          <input name="password" type="password" className="mt-1 w-full border rounded-md p-2" />
        </div>
        <button type="submit" className="w-full bg-primary text-white py-2 rounded-md font-semibold">রেজিস্টার</button>
      </form>
      <p className="mt-4 text-sm">অ্যাকাউন্ট আছে? <Link href="/login" className="text-primary">লগইন</Link></p>
    </div>
  )
}
