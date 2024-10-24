import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { login } from '../store/authSlice.js'
import { Button, Logo } from './index.js'
import authService from '../appwrite/auth.js'

function EmailVerification() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [searchParams] = useSearchParams()
    const [verificationStatus, setVerificationStatus] = useState('verifying') // verifying, success, error
    const [error, setError] = useState("")
    const [resendCooldown, setResendCooldown] = useState(0)

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const secret = searchParams.get('secret')
                const userId = searchParams.get('userId')

                if (!secret || !userId) {
                    setVerificationStatus('error')
                    setError('Invalid verification link')
                    return
                }

                await authService.confirmVerification(userId, secret)
                setVerificationStatus('success')

                // Log in the user after successful verification
                const userData = await authService.getCurrentUser()
                if (userData) {
                    dispatch(login(userData))
                    // Redirect after 3 seconds
                    setTimeout(() => navigate('/'), 3000)
                }
            } catch (error) {
                setVerificationStatus('error')
                setError(error.message)
            }
        }

        verifyEmail()
    }, [searchParams, navigate, dispatch])

    const handleResendVerification = async () => {
        if (resendCooldown > 0) return

        try {
            await authService.sendVerificationEmail()
            setResendCooldown(60) // Start 60 second cooldown

            // Countdown timer
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
          console.error("Verification email not recieved:", error);
            setError('Failed to resend verification email')
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

                {verificationStatus === 'verifying' && (
                    <div className='text-center'>
                        <h2 className='text-2xl font-bold leading-tight mb-4'>
                            Verifying Your Email
                        </h2>
                        <div className='animate-pulse text-gray-600'>
                            Please wait while we verify your email address...
                        </div>
                    </div>
                )}

                {verificationStatus === 'success' && (
                    <div className='text-center'>
                        <h2 className='text-2xl font-bold leading-tight text-green-600 mb-4'>
                            Email Verified Successfully!
                        </h2>
                        <p className='text-gray-600 mb-4'>
                            Thank you for verifying your email address.
                        </p>
                        <p className='text-gray-500'>
                            Redirecting you to the homepage...
                        </p>
                    </div>
                )}

                {verificationStatus === 'error' && (
                    <div className='text-center'>
                        <h2 className='text-2xl font-bold leading-tight text-red-600 mb-4'>
                            Verification Failed
                        </h2>
                        {error && <p className='text-red-600 mb-6'>{error}</p>}

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

                            <p className='text-center text-gray-600 mt-4'>
                                Want to try again later?{' '}
                                <Link
                                    to="/login"
                                    className='font-medium text-primary transition-all duration-200 hover:underline'
                                >
                                    Return to Login
                                </Link>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default EmailVerification
