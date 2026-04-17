import { useState, useEffect } from 'react';
import { MdHighlightOff, MdOutlineDarkMode } from "react-icons/md";
import { AiOutlineProduct, AiFillStar, AiFillMail } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import { HiCollection } from "react-icons/hi";
import { IoIosStats } from "react-icons/io";
import { authAxios, getUsername } from '../utils/Auth';
import { useSearchParams, useNavigate } from 'react-router-dom';

import './Premium.css';

const Premium = () => {
    const [searchParams] = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [loading2, setLoading2] = useState(false);

    const [status, setStatus] = useState(false);
    const [subscription, setSubscription] = useState(null);

    const [paymentMsg, setPaymentMsg] = useState(null);
    const [paymentError, setPaymentError] = useState(null);

    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;

    const username = getUsername();

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await authAxios.get(`${apiUrl}/api/payments/status/${username}`);

                if (response.status === 200) {
                    if (response.data.has_premium) {
                        setSubscription(response.data.subscription);
                        setStatus(true);
                    } 
                    else if (response.data.subscription?.status === 'PENDING') {
                        setSubscription(response.data.subscription);
                        setStatus(false);
                        setPaymentError('Trwa przetwarzanie płatności.');
                    } 
                    else {
                        setSubscription(null);
                        setStatus(false);
                    }
                }

                const param = searchParams.get('status');

                if (param) {
                    if (param === 'ok') {
                        setPaymentMsg('Płatność zakończona sukcesem.');
                    }

                    if (param === 'cancelled') {
                        setPaymentError('Płatność anulowana.');

                        try {
                            const statusResponse = await authAxios.get(`${apiUrl}/api/payments/status/${username}`);
                            const currentSub = statusResponse.data.subscription;

                            const cancelResponse = await authAxios.post(
                                `${apiUrl}/api/payments/set/${username}`,
                                {
                                    status: 'CANCELLED',
                                    plan: currentSub?.plan
                                },
                                { withCredentials: true }
                            );

                            if (cancelResponse.status === 200) {
                                setSubscription(null);
                                setStatus(false);
                            }
                        } catch (error) {
                            console.error("Błąd anulowania:", error);
                        }
                    }

                    navigate(window.location.pathname, { replace: true });
                }
            } catch (error) {
                console.error("Błąd podczas ładowania danych:", error);
            }
        };

        loadData();
    }, [apiUrl, username, searchParams, navigate]);

    const handlePayment = async (plan) => {
        try {
            setPaymentError(null);

            if (plan === 'PREMIUM') setLoading(true);
            else setLoading2(true);

            const response = await authAxios.post(`${apiUrl}/api/payments/create`, {
                plan,
            }, {
                withCredentials: true,
            });

            if (response.status === 200 && response.data.payment_url) {
                window.location.href = response.data.payment_url;
            } else {
                setPaymentError(response.data?.error || 'Błąd płatności.');
            }
        } catch (error) {
            console.error("Błąd płatności:", error);
            setPaymentError("Błąd podczas płatności.");
        } finally {
            setLoading(false);
            setLoading2(false);
        }
    };

    const handleCancel = async (fromRedirect = false) => {
        try {
            if (!fromRedirect) {
                const confirmCancel = window.confirm("Czy na pewno chcesz anulować subskrypcję?");
                if (!confirmCancel) return;
            }

            const statusResponse = await authAxios.get(`${apiUrl}/api/payments/status/${username}`);
            const currentSub = statusResponse.data.subscription;

            const response = await authAxios.post(`${apiUrl}/api/payments/set/${username}`, {
                status: 'CANCELLED',
                plan: currentSub?.plan
            }, {
                withCredentials: true,
            });

            if (response.status === 200) {
                setPaymentMsg(fromRedirect
                    ? 'Płatność anulowana.'
                    : 'Subskrypcja anulowana.'
                );

                setSubscription(null);
                setStatus(false);
            } else {
                setPaymentError('Błąd podczas anulowania.');
            }
        } catch (error) {
            console.error("Błąd anulowania:", error);
            setPaymentError("Błąd podczas anulowania.");
        }
    };

    return (
        <div className='premium-container'>
            {paymentMsg && <div className="payment-message">{paymentMsg}</div>}
            {paymentError && <div className="error-message">{paymentError}</div>}
            {subscription ? (
                subscription.plan === 'PREMIUM' ? (
                    <div>
                        <h1>Twój aktualny pakiet</h1>
                        <div className='current-subscription'>
                            <h2>{subscription.plan}</h2>
                            <div className='active-subscription'>
                                <p>Twój pakiet jest aktywny do:</p>
                                <p className='subscription-date'>{new Date(subscription.end_date).toLocaleString('pl-PL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                                </p>
                            </div>
                            <button className='cancel-button' onClick={() => handleCancel(false)}>Anuluj subskrypcję</button>
                        </div>
                        <div className='upgrade-premiumplus'>
                            <h2>Chcesz więcej?</h2>
                            <div className='premiumplus-content'>
                                <h2>PREMIUM+</h2>
                                <h3>14,99 zł</h3>
                                <h4>do końca trwania aktualnego pakietu</h4>
                                <p><AiFillStar className='icons'/>Wszystko co pakiet PREMIUM</p>
                                <p><MdOutlineDarkMode className='icons'/>Motywy kolorystyczne</p>
                                <p><IoIosStats className='icons'/>Zaawansowane statystyki</p>
                                <p><AiFillMail className='icons'/>Powiadomienia o nowych książkach</p>
                                <div className='premiumplus-button'>
                                    <button
                                        type='button'
                                        onClick={() => handlePayment('PREMIUM+_UPGRADE')}
                                        disabled={loading2}
                                    >
                                        {loading2 ? 'Przetwarzanie...' : 'Ulepsz do PREMIUM+'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h1>Twój aktualny pakiet</h1>
                        <div className='current-subscription'>
                            <h2>{subscription.plan}</h2>
                            <div className='active-subscription'>
                                <p>Twój pakiet jest aktywny do:</p>
                                <p className='subscription-date'>{new Date(subscription.end_date).toLocaleString('pl-PL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                                </p>
                            </div>
                            <button className='cancel-button' onClick={() => handleCancel(false)}>Anuluj subskrypcję</button>
                        </div>
                    </div>
                )
            ) : (
                <div>
                    <h1>Premium</h1>
                    <div className='premium-cards'>
                        <div className='premium-content'>
                            <h2>PREMIUM</h2>
                            <h3>19,99 zł / 30 dni</h3>
                            <p><MdHighlightOff className='icons'/>Brak reklam</p>
                            <p><AiOutlineProduct className='icons'/>Import i eksport książek</p>
                            <p><RxAvatar className='icons'/>Animowany awatar</p>
                            <p><HiCollection className='icons'/>Większy limit książek</p>
                            <div className='premium-button'>
                            <button
                                    type='button' 
                                    onClick={() => handlePayment('PREMIUM')}
                                    disabled={loading || status} 
                                >
                                    {loading ? 'Przetwarzanie...' : 'Kup pakiet PREMIUM'}
                                </button>
                            </div>    
                        </div>
                        <div className='premiumplus-content'>
                            <h2>PREMIUM+</h2>
                            <h3>34,99 zł / 30 dni</h3>
                            <p><AiFillStar className='icons'/>Wszystko co pakiet PREMIUM</p>
                            <p><MdOutlineDarkMode className='icons'/>Motywy kolorystyczne</p>
                            <p><IoIosStats className='icons'/>Zaawansowane statystyki</p>
                            <p><AiFillMail className='icons'/>Powiadomienia o nowych książkach</p>
                            <div className='premiumplus-button'>
                                <button 
                                    type='button'
                                    onClick={() => handlePayment('PREMIUM+')}
                                    disabled={loading2 || status}
                                >
                                    {loading2 ? 'Przetwarzanie...' : 'Kup pakiet PREMIUM+'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Premium;