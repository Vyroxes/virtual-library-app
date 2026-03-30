
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { authAxios } from '../utils/Auth';

import './AddBook.css';

const EditBook = () =>
{
    const navigate = useNavigate();
    const location = useLocation();
    const [showCover, setShowCover] = useState(false);
    const [showCoverSearch, setShowCoverSearch] = useState(false);
    const [coverSearchResults, setCoverSearchResults] = useState([]);
    const [coverSearchLoading, setCoverSearchLoading] = useState(false);
    const [coverSearchError, setCoverSearchError] = useState("");
    const [checkedList, setCheckedList] = useState([]);
    const [book, setBook] = useState([]);

    const [isbn, setISBN] = useState("");
    const [cover, setCover] = useState("");
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [genres, setGenres] = useState("");
    const [publisher, setPublisher] = useState("");
    const [date, setDate] = useState("");
    const [pages, setPages] = useState("");
    const [desc, setDesc] = useState("");

    const { id } = useParams();

    const genresList = [
        "fantasy",
        "science-fiction",
        "horror",
        "romans",
        "thriller",
        "kryminał",
        "historia",
        "poradnik",
        "dla dzieci",
        "dla młodzieży",
        "komiks",
        "manga",
        "na podstawie gry",
        "lektura",
        "beletrystyka",
        "poezja",
        "erotyczne",
        "literatura piękna",
        "przygoda",
        "sensacja",
        "biografia",
        "reportaż",
        "popularnonaukowe",
    ];

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        checkBookID();
    }, []);

    useEffect(() => 
    {
        if (book && Object.keys(book).length > 0) 
        {
            setISBN(book.isbn);
            setCover(book.cover || "/unknown.jpg");
            setTitle(book.title);
            setAuthor(book.author);
            setGenres(book.genres);
            setPublisher(book.publisher);
            const parts = book.date.split("-");
            const [day, month, year] = parts;
            const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            setDate(formattedDate);
            setPages(book.pages);
            setDesc(book.desc);
            setCheckedList(book.genres.split(", "));
        }
    }, [book]);

    const handleCoverSearch = async () => {
        setCoverSearchLoading(true);
        setCoverSearchError("");
        setCoverSearchResults([]);
        try {
            const response = await authAxios.get(`${apiUrl}/api/search-covers`, {
                params: {
                    title,
                    author
                }
            });
            if (response.status === 200 && Array.isArray(response.data)) {
                setCoverSearchResults(response.data);
            } else {
                setCoverSearchError("Brak wyników lub błąd odpowiedzi.");
            }
        } catch (error) {
            setCoverSearchError("Błąd podczas wyszukiwania okładek.");
        } finally {
            setCoverSearchLoading(false);
        }
    };

    const handleSelectCover = (url) => {
        setCover(url);
        setShowCoverSearch(false);
    };

    const checkBookID = async () => 
    {
        try 
        {
            let response;
            const type = location.pathname.startsWith("/bc-edit-book/") ? "bc" : "wl";

            response = await authAxios.get(`${apiUrl}/api/book-exists/${type}/${id}`);

            if (response.status === 200) {
                if (response.data['exists'] === false) {
                    if (location.pathname.startsWith("/bc-edit-book/")) {
                        navigate(`/bc-book-details/${id}`);
                    } else if (location.pathname.startsWith("/wl-edit-book/")) {
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

    const fetchBook = async () => 
    {
        try 
        {
            let response;
            const type = location.pathname.startsWith("/bc-edit-book/") ? "bc" : "wl";

            response = await authAxios.get(`${apiUrl}/api/book-details/${type}/${id}`);

            if (response.status === 200) {
                setBook(response.data);
            }
        } catch (error) {
            console.error('Błąd podczas pobierania szczegółów książki: ', error);
        }
    };

    useEffect(() => 
    {
        setGenres(checkedList.sort((a, b) => genresList.indexOf(a) - genresList.indexOf(b)).join(", "));
    }, [checkedList]);

    const handleFileUpload = (file) =>
    {
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Plik jest za duży. Maksymalny rozmiar to 5 MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setCover(reader.result);
        };

        reader.onerror = () => {
            console.error("Błąd podczas odczytu pliku: ", error);
            alert("Wystąpił problem z odczytem pliku.");
        };

        reader.readAsDataURL(file);
    };

    const onSubmit = async () => {
        try {
            let response;
            const type = location.pathname.startsWith("/bc-edit-book/") ? "bc" : "wl";

            response = await authAxios.patch(`${apiUrl}/api/edit-book/${type}/${id}`, {
                title,
                author,
                cover,
                genres,
                publisher,
                date,
                pages,
                isbn,
                desc,
            });

            if (response.status === 200) {
                if (location.pathname.startsWith("/bc-edit-book/")) {
                    navigate(`/bc-book-details/${id}`);
                } else if (location.pathname.startsWith("/wl-edit-book/")) {
                    navigate(`/wl-book-details/${id}`);
                }
            }
        } catch (error) {
            console.error('Błąd podczas edytowania książki: ', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (checkedList.length === 0) {
            alert("Musisz wybrać przynajmniej jeden gatunek.");
            return;
        }

        await onSubmit();
    };

    const handleGenreChange = (event) => 
    {
        const { checked, value } = event.target;
    
        setCheckedList((prev) => 
        {
            if (checked) 
            {
                return [...prev, value];
            } 
            else 
            {
                return prev.filter((genre) => genre !== value);
            }
        });
    };

    return (
        <div>
            <div className="add-book-container">
                <div className="add-book-form">
                    <h1>Edytuj książkę</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="add-book-row">
                            <label>
                                Okładka (URL):
                                <input
                                    type="text"
                                    id="cover"
                                    name='cover'
                                    value={cover}
                                    onChange={(e) => setCover(e.target.value)}
                                />
                            </label>
                            <label>
                                Okładka (wybierz plik):
                                <input
                                    type="file"
                                    id='file'
                                    name='file'
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e.target.files[0])}
                                />
                            </label>
                            <button type="button" onClick={() => setShowCover(!showCover)} style={{marginRight: '8px'}}>
                                {showCover ? "Ukryj podgląd okładki" : "Pokaż podgląd okładki"}
                            </button>
                            <button type="button" disabled={!title.trim() || !author.trim()} onClick={() => { setShowCoverSearch(true); handleCoverSearch(); }}>
                                Wyszukaj okładkę
                            </button>
                        </div>
                        {showCoverSearch && (
                            <div>
                                <div className="add-book-covers">
                                    <h2>Wyniki wyszukiwania okładek</h2>
                                    <button onClick={() => setShowCoverSearch(false)}>✕</button>
                                    {coverSearchLoading && <div>Ładowanie...</div>}
                                    {coverSearchError && <div style={{color: 'red'}}>{coverSearchError}</div>}
                                    {!coverSearchLoading && !coverSearchError && coverSearchResults.length === 0 && (
                                        <div>Brak wyników.</div>
                                    )}
                                    <div className="add-book-covers-list">
                                        {coverSearchResults.map((url, index) => (
                                            <div key={index} className="add-book-covers-book" style={{"--card-index": index}} onClick={() => handleSelectCover(url)}>
                                                <img src={url} alt="Okładka"/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {showCover && (
                        <div className="add-book-cover">
                            <img src={cover || "unknown.jpg"} alt="Podgląd okładki" style={{ maxWidth: "350px", maxHeight: "500px" }} />
                        </div>
                        )}
                        <div className="add-book-row">
                            <label>
                                Tytuł:
                                <input
                                    type="text"
                                    id='title'
                                    name='title'
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    minLength="2"
                                    maxLength="100"
                                />
                            </label>
                            <label>
                                Autor:
                                <input
                                    type="text"
                                    id='author'
                                    name='author'
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    required
                                    minLength="5"
                                    maxLength="100"
                                />
                            </label>
                        </div>
                        <div className="add-book-row-genres">
                            <a>Gatunki:</a>
                            {genresList.map((genre) => (
                                <label key={genre}>
                                    <input
                                        type="checkbox"
                                        id={genre}
                                        name={genre}
                                        value={genre}
                                        checked={checkedList.includes(genre)}
                                        onChange={handleGenreChange}
                                    />
                                    {genre}
                                </label>
                            ))}
                        </div>
                        <div className="add-book-row">
                            <label>
                                Wydawnictwo:
                                <input
                                    type="text"
                                    id='publisher'
                                    name='publisher'
                                    value={publisher}
                                    onChange={(e) => setPublisher(e.target.value)}
                                    required
                                    minLength="5"
                                    maxLength="100"
                                />
                            </label>
                        </div>
                        <div className="add-book-row">
                            <label>
                                Data wydania:
                                <input
                                    type="date"
                                    id='date'
                                    name='date'
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Liczba stron:
                                <input
                                    type="number"
                                    id='pages'
                                    name='pages'
                                    value={pages}
                                    onChange={(e) => setPages(e.target.value)}
                                    required
                                    min={1}
                                    max={9999}
                                />
                            </label>
                        </div>
                        <div className="add-book-row">
                            <label>
                                ISBN:
                                <input
                                    type="number"
                                    id='isbn'
                                    name='isbn'
                                    value={isbn}
                                    onChange={(e) => setISBN(e.target.value)}
                                    required
                                    min={1000000000000}
                                    max={9999999999999}
                                />
                            </label>
                        </div>
                        <div className="add-book-row">
                            <a>Opis:</a>
                            <textarea
                                type="text"
                                id='desc'
                                name='desc'
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                required
                                minLength="1"
                                maxLength="5000"
                            />
                        </div>
                        <div className="add-book-buttons">
                            <button type="submit">Edytuj książkę</button>
                            <button type="button" onClick={() => {
                                if(location.pathname.startsWith("/bc-edit-book/"))
                                {
                                    navigate(`/bc-book-details/${id}`);
                                }
                                else if(location.pathname.startsWith("/wl-edit-book/"))
                                {
                                    navigate(`/wl-book-details/${id}`);
                                }
                            }}>
                                Anuluj
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditBook;