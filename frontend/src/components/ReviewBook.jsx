import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { authAxios } from '../utils/Auth';

import './ReviewBook.css';

const ReviewBook = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [book, setBook] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rate, setRate] = useState(null);
    const [review, setReview] = useState("");

    const { id } = useParams();

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => 
    {
        const run = async () => 
        {
            try 
            {
                const type = location.pathname.startsWith("/bc-review-book/") ? "bc" : "wl";

                const response = await authAxios.get(`${apiUrl}/api/book-exists/${type}/${id}`);

                if (response.status === 200) 
                {
                    if (response.data['exists'] === false) 
                    {
                        if (location.pathname.startsWith("/bc-review-book/")) {
                            navigate(`/bc-book-details/${id}`);
                        } 
                        else if (location.pathname.startsWith("/wl-review-book/")) {
                            navigate(`/wl-book-details/${id}`);
                        }
                    } 
                    else 
                    {
                        const fetchBook = async () => 
                        {
                            const res = await authAxios.get(`${apiUrl}/api/book-details/${type}/${id}`);
                            setBook(res.data);
                            setLoading(false);
                        };

                        await fetchBook();
                    }
                } 
                else 
                {
                    navigate('/home');
                }
            } 
            catch (error) 
            {
                console.error('Błąd podczas sprawdzania ID książki: ', error);
                navigate('/home');
            }
        };

        run();
    }, [apiUrl, id, location.pathname, navigate]);

    useEffect(() => {
        if (book && Object.keys(book).length > 0) {
            setRate(book.rate ?? null);
            setReview(book.review || "");
        }
    }, [book]);

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
                rate: rate ?? null,
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

    const StarRating = ({ value, onChange, max = 10 }) => {
        const [hoverValue, setHoverValue] = useState(null);

        const displayValue = hoverValue ?? value ?? 0;

        return (
            <div
                className="star-rating"
                onMouseLeave={() => setHoverValue(null)}
            >
                {Array.from({ length: max }, (_, i) => {
                    const starIndex = i + 1;

                    return (
                        <div key={i} className="star-wrapper">
                            <button
                                type="button"
                                className="star-hitbox half left"
                                onMouseEnter={() => setHoverValue(starIndex - 0.5)}
                                onClick={() =>
                                    onChange(value === starIndex - 0.5 ? null : starIndex - 0.5)
                                }
                            />
                            <button
                                type="button"
                                className="star-hitbox half right"
                                onMouseEnter={() => setHoverValue(starIndex)}
                                onClick={() =>
                                    onChange(value === starIndex ? null : starIndex)
                                }
                            />
                            <span
                                className={`star ${
                                    displayValue >= starIndex
                                        ? "filled"
                                        : displayValue >= starIndex - 0.5
                                        ? "half-filled"
                                        : ""
                                }`}
                            >
                                ★
                            </span>
                        </div>
                    );
                })}

                <span className="star-value">
                    {value ? value.toFixed(1) : "Brak"}
                </span>
            </div>
        );
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
                    <StarRating value={rate} onChange={setRate} max={10} />
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