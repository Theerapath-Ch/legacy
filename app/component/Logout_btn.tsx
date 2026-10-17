"use client"

import { useState } from "react"

const Logout_btn = () => {
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>("")

    const handleLogOut = async () => {
        setLoading(true)
        setError("")

        try {

            const response = await fetch("/api/auth/sign-out", {
                method: "POST",
                headers: {
                    "content-type" : "application/json"
                } ,
                credentials: "include" ,
                body:JSON.stringify({})
            })

            console.log(response);
            


            if (!response.ok) {
                setError("Logout ไม่สำเร็จ")
                return
            }

            window.location.assign("/login")
        } catch (error) {
            setError("เชื่อมต่อ Server ไม่ได้")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleLogOut}
                disabled={loading}
                className="rounded-lg w-full mt-1 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
                {loading ? "กำลังออกจากระบบ" : "Logout"}
            </button>

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}

        </div>
    )
}

export default Logout_btn