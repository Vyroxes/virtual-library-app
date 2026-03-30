import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { authAxios } from '../utils/Auth';

import './BookDetails.css';

const BookDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [book, setBook] = useState([]);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        checkBookID();
    }, []);

    const checkBookID = async () => {
        try {
            let response;
            const type = location.pathname.startsWith("/bc-book-details/") ? "bc" : "wl";

            response = await authAxios.get(`${apiUrl}/api/book-exists/${type}/${id}`);

            if (response.status === 200) {
                if (response.data['exists'] === false) {
                    if (location.pathname.startsWith("/bc-book-details/")) {
                        navigate('/book-collection');
                    } else if (location.pathname.startsWith("/wl-book-details/")) {
                        navigate('/wish-list');
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
            const type = location.pathname.startsWith("/bc-book-details/") ? "bc" : "wl";

            response = await authAxios.get(`${apiUrl}/api/book-details/${type}/${id}`);

            if (response.status === 200) {
                setBook(response.data);
                setLoading(false);
            }
        } catch (error) {
            console.error('Błąd podczas pobierania danych książki: ', error);
        }
    };

    const moveBook = async () => {
        const confirmMove = window.confirm(
            location.pathname.startsWith("/bc-book-details/")
            ? "Czy na pewno chcesz przenieść tę książkę na listę życzeń?" 
            : "Czy na pewno chcesz przenieść tę książkę do kolekcji?"
        );
        
        if (!confirmMove) {
            return;
        }
        try {
            let response;
            const type = location.pathname.startsWith("/bc-book-details/") ? "bc" : "wl";

            response = await authAxios.post(`${apiUrl}/api/move-book-to/${type}/${id}`);

            if (response.status === 200) {
                if (location.pathname.startsWith("/bc-book-details/")) {
                    navigate('/wish-list');
                } else if (location.pathname.startsWith("/wl-book-details/")) {
                    navigate('/book-collection');
                }
            }
        } catch (error) {
            console.error('Błąd podczas przenoszenia książki: ', error);
        }
    };

    const removeBook = async () => {
        const confirmDelete = window.confirm(
            location.pathname.startsWith("/bc-book-details/")
            ? "Czy na pewno chcesz usunąć tę książkę z kolekcji?" 
            : "Czy na pewno chcesz usunąć te książkę z listy życzeń?"
        );
        
        if (!confirmDelete) {
            return;
        }

        try {
            let response;
            const type = location.pathname.startsWith("/bc-book-details/") ? "bc" : "wl";

            response = await authAxios.delete(`${apiUrl}/api/remove-book/${type}/${id}`);

            if (response.status === 200) {
                if (location.pathname.startsWith("/bc-book-details/")) {
                    navigate('/book-collection');
                } else if (location.pathname.startsWith("/wl-book-details/")) {
                    navigate('/wish-list');
                }
            }
        } catch (error) {
            console.error('Błąd podczas usuwania książki: ', error);
        }
    };

    if (loading) {
        return;
    }

    return (
        <div className='book-details-container'>
            <div className='book-details'>
                <div className='book-details-cover'>
                    <img
                        src={book.cover || "/unknown.jpg"}
                        alt={book.title}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/unknown.jpg";
                        }}
                        loading="lazy"
                    />
                </div>
                <div className='book-details-info'>
                    <h1>{book.id}. {book.title}</h1>
                    <h2>{book.author}</h2>
                    <h3>Gatunki: {book.genres}</h3>
                    <h3>Wydawnictwo: {book.publisher}</h3>
                    <h3>Data wydania: {book.date}</h3>
                    <h3>Liczba stron: {book.pages}</h3>
                    <h3>ISBN: {book.isbn}</h3>
                    <h3>Recenzja: {book.rate || "-"}/10 - {book.review || "brak recenzji"}</h3>
                    <h4 className='book-details-info-desc'>Opis: {book.desc || "brak opisu"}</h4>
                </div>
            </div>
            <div className='book-details-buttons'>
                <button onClick={() => {
                    if (location.pathname.startsWith("/bc-book-details/")) {
                        navigate("/book-collection");
                    } else if (location.pathname.startsWith("/wl-book-details/")) {
                        navigate("/wish-list");
                    }
                }}>Powrót</button>
                <button onClick={() => {
                    if (location.pathname.startsWith("/bc-book-details/")) {
                        navigate(`/bc-edit-book/${id}`);
                    } else if (location.pathname.startsWith("/wl-book-details/")) {
                        navigate(`/wl-edit-book/${id}`);
                    }
                }}>Edytuj</button>
                <button onClick={() => {
                    if (location.pathname.startsWith("/bc-book-details/")) {
                        navigate(`/bc-review-book/${id}`);
                    } else if (location.pathname.startsWith("/wl-book-details/")) {
                        navigate(`/wl-review-book/${id}`);
                    }
                }}>Recenzja</button>
                {(location.pathname.startsWith("/bc-book-details/")) && (<button onClick={() => moveBook()}>Przenieś do listy życzeń</button>)}
                {(location.pathname.startsWith("/wl-book-details/")) && (<button onClick={() => moveBook()}>Przenieś do kolekcji książek</button>)}
                <button onClick={() => removeBook()}>Usuń</button>
            </div>
        </div>
    );
};

export default BookDetails;