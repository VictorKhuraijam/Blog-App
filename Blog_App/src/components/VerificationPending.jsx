import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Button, Logo } from './index.js'
import authService from '../appwrite/auth.js'

function VerificationPending() {
    const location = useLocation()
    const email = location.state?.email
    const [resendCooldown, setResendCooldown] = useState(0)
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    const handleResendVerification = async () => {
        if (resendCooldown > 0) return

        try {
            await authService.sendVerificationEmail()
            setSuccessMessage("Verification email sent successfully!")
            setError("")
            setResendCooldown(60)

            const timer = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } catch (error) {
          console.error("Verification email not successful:", error);
            setError("Failed to resend verification email")
            setSuccessMessage("")
        }
    }

    return (
        <div className='flex items-center justify-center w-full m-4'>
            <div className={`mx-auto w-full max-w-lg bg-gray-100 rounded-xl p-10 border border-black/10`}>
                <div className='mb-2 flex justify-center'>
                    <span className='inline-block w-full max-w-[100px]'>
                        <Logo width='100%'/>
                    </span>
                </div>

                <h2 className='text-center text-2xl font-bold leading-tight mb-4'>
                    Verify Your Email
                </h2>

                <div className='text-center mb-6'>
                    <p className='text-gray-600'>
                        We have sent a verification email to:
                        <br />
                        <span className='font-medium'>{email}</span>
                    </p>
                </div>

                {error && <p className='text-red-600 text-center mb-4'>{error}</p>}
                {successMessage && <p className='text-green-600 text-center mb-4'>{successMessage}</p>}

                <div className='space-y-4'>
                    <Button
                        onClick={handleResendVerification}
                        disabled={resendCooldown > 0}
                        className='w-full'
                    >
                        {resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : 'Resend Verification Email'}
                    </Button>

                    <p className='text-center text-gray-600'>
                        Already verified?{' '}
                        <Link
                            to="/login"
                            className='font-medium text-primary transition-all duration-200 hover:underline'
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default VerificationPending
