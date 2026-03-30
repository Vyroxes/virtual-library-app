import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { authAxios } from '../utils/Auth';

import './ReviewBook.css';

const ReviewBook = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [book, setBook] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rate, setRate] = useState("");
    const [review, setReview] = useState("");

    const { id } = useParams();

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        checkBookID();
    }, []);

    useEffect(() => {
        if (book && Object.keys(book).length > 0) {
            setRate(book.rate || "");
            setReview(book.review || "");
        }
    }, [book]);

    const checkBookID = async () => {
        try {
            let response;
            const type = location.pathname.startsWith("/bc-review-book/") ? "bc" : "wl";

            response = await authAxios.get(`${apiUrl}/api/book-exists/${type}/${id}`);

            if (response.status === 200) {
                if (response.data['exists'] === false) {
                    if (location.pathname.startsWith("/bc-review-book/")) {
                        navigate(`/bc-book-details/${id}`);
                    } else if (location.pathname.startsWith("/wl-review-book/")) {
                        navigate(`/wl-book-details/${id}`);
                    }
                } else {
                    fetchBook();
                }
            } else {
                navigate('/home');
            }
        } catch (error) {
            console.error('Błąd podczas sprawdzania ID książki: ', error);
            navigate('/home');
        }
    };

    const fetchBook = async () => {
        try {
            let response;
            const type = location.pathname.startsWith("/bc-review-book/") ? "bc" : "wl";

            response = await authAxios.get(`${apiUrl}/api/book-details/${type}/${id}`);

            if (response.status === 200) {
                setBook(response.data);
                setLoading(false);
            }
        } catch (error) {
            console.error('Błąd podczas pobierania danych książki: ', error);
        }
    };

    const deleteReview = async () => {
        const confirmCancel = window.confirm("Czy na pewno chcesz usunąć recenzję?");
        
        if (!confirmCancel) {
            return;
        }
        
        try {
            let response;
            const type = location.pathname.startsWith("/bc-review-book/") ? "bc" : "wl";

            response = await authAxios.patch(`${apiUrl}/api/review-book/${type}/${id}`, {
                rate: null,
                review: null,
            });

            if (response.status === 200) {
                if (location.pathname.startsWith("/bc-review-book/")) {
                    navigate(`/bc-book-details/${id}`);
                } else if (location.pathname.startsWith("/wl-review-book/")) {
                    navigate(`/wl-book-details/${id}`);
                }
            }
        } catch (error) {
            console.error("Błąd podczas usuwania recenzji: ", error);
        }
    };

    const onSubmit = async () => {
        try {
            let response;
            const type = location.pathname.startsWith("/bc-review-book/") ? "bc" : "wl";

            response = await authAxios.patch(`${apiUrl}/api/review-book/${type}/${id}`, {
                rate,
                review,
            });

            if (response.status === 200) {
                if (location.pathname.startsWith("/bc-review-book/")) {
                    navigate(`/bc-book-details/${id}`);
                } else if (location.pathname.startsWith("/wl-review-book/")) {
                    navigate(`/wl-book-details/${id}`);
                }
            }
        } catch (error) {
            console.error("Błąd podczas aktualizowania recenzji: ", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        await onSubmit();
    };

    if (loading) {
        return;
    }

    return (
        <div className='review-book-container'>
            <h1>Dodaj recenzję</h1>
            <form onSubmit={handleSubmit}>
                <div className='review-book-row'>
                    <a>Ocena</a>
                    <input
                        type="number"
                        id="rate"
                        name='rate'
                        required
                        min={0}
                        max={10}
                        step={0.1}
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                    />
                </div>
                <div className='review-book-row'>
                    <a>Recenzja</a>
                    <textarea
                        id="review"
                        name='review'
                        value={review}
                        required
                        minLength="1"
                        maxLength="100"
                        onChange={(e) => setReview(e.target.value)}
                    />
                </div>
                <div className='review-book-buttons'>
                    {(book.rate === "" || book.rate === null) && (book.review === "" || book.review === null) && (<button type="submit">Dodaj recenzję</button>)}
                    {book.rate !== "" && book.rate !== null && book.review !== "" && book.review !== null && (
                        <>
                            <button type="submit">Zmień recenzję</button>
                            <button type="button" onClick={() => { deleteReview()}}>Usuń recenzję</button>
                        </>
                    )}
                    <button onClick={() => {
                        if (location.pathname.startsWith("/bc-review-book/")) {
                            navigate(`/bc-book-details/${id}`);
                        } else if (location.pathname.startsWith("/wl-review-book/")) {
                            navigate(`/wl-book-details/${id}`);
                        }
                    }}>Anuluj</button>
                </div>
            </form>
        </div>
    );
};

export default ReviewBook;