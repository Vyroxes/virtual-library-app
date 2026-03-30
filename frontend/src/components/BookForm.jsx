import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { authAxios } from '../utils/Auth';

import './BookForm.css';

const BookForm = ({ mode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const apiUrl = import.meta.env.VITE_API_URL;

    const [addBookMethod, setAddBookMethod] = useState("");
    const [showCover, setShowCover] = useState(false);
    const [showCoverSearch, setShowCoverSearch] = useState(false);
    const [coverSearchResults, setCoverSearchResults] = useState([]);
    const [coverSearchLoading, setCoverSearchLoading] = useState(false);
    const [coverSearchError, setCoverSearchError] = useState("");
    const [checkedList, setCheckedList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [jsonFileContent, setJsonFileContent] = useState(null);
    const [isbn, setISBN] = useState("");
    const [cover, setCover] = useState("");
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [genres, setGenres] = useState("");
    const [publisher, setPublisher] = useState("");
    const [date, setDate] = useState("");
    const [pages, setPages] = useState("");
    const [desc, setDesc] = useState("");
    const [book, setBook] = useState([]);

    const genresList = [
        "fantasy", "science-fiction", "horror", "romans", "thriller", "kryminał", "historia", "poradnik", "dla dzieci", "dla młodzieży", "komiks", "manga", "na podstawie gry", "lektura", "beletrystyka", "poezja", "erotyczne", "literatura piękna", "przygoda", "sensacja", "biografia", "reportaż", "popularnonaukowe"
    ];

    useEffect(() => {
        setGenres(checkedList.sort((a, b) => genresList.indexOf(a) - genresList.indexOf(b)).join(", "));
    }, [checkedList]);

    useEffect(() => {
        if (mode === "edit") {
            checkBookID();
        }
    }, []);

    useEffect(() => {
        if (mode === "edit" && book && Object.keys(book).length > 0) {
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
                params: { title, author }
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

    const handleFileUpload = (file) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("Plik jest za duży. Maksymalny rozmiar to 5 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => { setCover(reader.result); };
        reader.onerror = () => { alert("Wystąpił problem z odczytem pliku."); };
        reader.readAsDataURL(file);
    };

    const checkBookID = async () => {
        try {
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

    const fetchBook = async () => {
        setLoading(true);
        try {
            let response;
            const type = location.pathname.startsWith("/bc-edit-book/") ? "bc" : "wl";
            response = await authAxios.get(`${apiUrl}/api/book-details/${type}/${id}`);
            if (response.status === 200) {
                setBook(response.data);
            }
        } catch (error) {
            console.error('Błąd podczas pobierania szczegółów książki: ', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenreChange = (event) => {
        const { checked, value } = event.target;
        setCheckedList((prev) => checked ? [...prev, value] : prev.filter((genre) => genre !== value));
    };

    const autoFillBookInfo = async () => {
        if (!title || !author) return;
        try {
            setLoading(true);
            const response = await authAxios.post(`${apiUrl}/api/generate-book-info`, { title, author });
            setPublisher(response.data.publisher || '');
            setDate(response.data.date || '');
            setPages(response.data.pages ? response.data.pages.toString() : '');
            setISBN(response.data.isbn || '');
            setGenres(response.data.genres || '');
            setDesc(response.data.desc || '');
            if (response.data.genres) {
                const receivedGenres = response.data.genres.split(',').map(g => g.trim()).filter(g => g.length > 0);
                setCheckedList(receivedGenres.filter(g => genresList.includes(g)));
            }
        } catch (err) {
            console.error('Błąd podczas generowania danych o książce: ', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (checkedList.length === 0) {
            alert("Musisz wybrać przynajmniej jeden gatunek.");
            return;
        }
        if (mode === "edit") {
            await onSubmitEdit();
        } else {
            await onSubmitAdd();
        }
    };

    const onSubmitAdd = async (book) => {
        try {
            let response;
            const type = location.pathname === "/bc-add-book" ? "bc" : "wl";
            if (book) {
                response = await authAxios.post(`${apiUrl}/api/add-book/${type}`, book); 
            }
            else {
                response = await authAxios.post(`${apiUrl}/api/add-book/${type}`, {
                    title, author, cover, genres, publisher, date, pages, isbn, desc
                });
            }
            if (response.status === 201) {
                if(addBookMethod !== "json") {
                    if(location.pathname === "/bc-add-book") navigate('/book-collection');
                    else if(location.pathname === "/wl-add-book") navigate('/wish-list');
                }
            }

            return response;
        } catch (error) {
            console.error("Błąd podczas dodawania książki: ", error);
            throw error;
        }
    };

    const onSubmitEdit = async () => {
        try {
            let response;
            const type = location.pathname.startsWith("/bc-edit-book/") ? "bc" : "wl";
            response = await authAxios.patch(`${apiUrl}/api/edit-book/${type}/${id}`, {
                title, author, cover, genres, publisher, date, pages, isbn, desc
            });
            if (response.status === 200) {
                if (location.pathname.startsWith("/bc-edit-book/")) navigate(`/bc-book-details/${id}`);
                else if (location.pathname.startsWith("/wl-edit-book/")) navigate(`/wl-book-details/${id}`);
            }
        } catch (error) {
            console.error("Błąd podczas edytowania książki: ", error);
            throw error;
        }
    };

    const handleCheckISBN = async () => {
        if (!isbn) {
            alert("Pole z kodem ISBN musi być wypełnione!");
            return;
        }

        const bookData = await fetchBookByISBN(isbn);
        if (bookData) {
            setTitle(bookData.title);
            setAuthor(bookData.author);
            setCover(bookData.cover);
            setPublisher(bookData.publisher);
            setDate(bookData.date);
            setPages(bookData.pages);
            setDesc(bookData.desc);
        }
    };

    const fetchBookByISBN = async (isbn) => {
        try {
            const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
            );
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const book = data.items[0].volumeInfo;
                return {
                    title: book.title || "",
                    author: book.authors ? book.authors.join(", ") : "",
                    cover: book.imageLinks ? book.imageLinks.thumbnail : "unknown.jpg",
                    publisher: book.publisher || "",
                    date: book.publishedDate || "",
                    pages: book.pageCount || "",
                    desc: book.description || "",
                };
            } else {
                alert("Nie znaleziono książki o tym kodzie ISBN.");
                return null;
            }
        } catch (error) {
            console.error("Błąd podczas pobierania danych książki: ", error);
            alert("Wystąpił błąd podczas pobierania danych książki.");
            return null;
        }
    };

    const handleJsonFileSelect = (file) => {
        if (!file) {
            setJsonFileContent(null);
            return;
        }
    
        const reader = new FileReader();
        reader.onload = () => {
            try {
                setJsonFileContent(reader.result);
            } catch (error) {
                console.error("Błąd podczas odczytywania pliku JSON: ", error);
                alert("Wystąpił problem z odczytem pliku JSON.");
                setJsonFileContent(null);
            }
        };
    
        reader.onerror = () => {
            console.error("Błąd podczas odczytu pliku JSON.");
            alert("Wystąpił problem z odczytem pliku JSON.");
            setJsonFileContent(null);
        };
    
        reader.readAsText(file);
    };

    const processJsonFile = async () => {
        if (!jsonFileContent) {
            alert("Najpierw wybierz plik JSON.");
            return;
        }

        setIsProcessing(true);

        try {
            const jsonData = JSON.parse(jsonFileContent);
            
            if (jsonData["book-collection"] || jsonData["wish-list"]) {
                const booksToAdd = [];

                if (location.pathname === "/bc-add-book" && jsonData["book-collection"]) {
                    jsonData["book-collection"].forEach((book) => {
                        booksToAdd.push({
                            title: book.title || "",
                            author: book.author || "",
                            cover: book.cover || "",
                            genres: book.genres || "",
                            publisher: book.publisher || "",
                            date: book.date || "",
                            pages: book.pages || "",
                            isbn: book.isbn || "",
                            desc: book.desc || "",
                            rate: book.rate || "",
                            review: book.review || "",
                        });
                    });
                } else if (location.pathname === "/wl-add-book" && jsonData["wish-list"]) {
                    jsonData["wish-list"].forEach((book) => {
                        booksToAdd.push({
                            title: book.title || "",
                            author: book.author || "",
                            cover: book.cover || "",
                            genres: book.genres || "",
                            publisher: book.publisher || "",
                            date: book.date || "",
                            pages: book.pages || "",
                            isbn: book.isbn || "",
                            desc: book.desc || "",
                            rate: book.rate || "",
                            review: book.review || "",
                        });
                    });
                }

                if (booksToAdd.length > 0) {
                    let addedCount = 0;
                    let bookCount = booksToAdd.length;
                    for (const book of booksToAdd) {
                        let response;
                        try {
                            response = await onSubmitAdd(book);

                            if (response.status === 201) {
                                addedCount++;
                            }
                            else {
                                bookCount--;
                                console.error(`Błąd podczas dodawania książki "${book.title}."`);
                            }
                        } catch (error) {
                            console.error(`Błąd podczas dodawania książki "${book.title}": `, error);
                        }
                    }
                    
                    if (addedCount === bookCount) {
                        if (location.pathname === "/bc-add-book") {
                            navigate('/book-collection');
                        } else if (location.pathname === "/wl-add-book") {
                            navigate('/wish-list');
                        }
                    } 
                    else if (addedCount > 0) {
                        alert(`Dodano ${addedCount} książek, ale wystąpiły błędy podczas dodawania pozostałych.`);
                        if (location.pathname === "/bc-add-book") {
                            navigate('/book-collection');
                        } else if (location.pathname === "/wl-add-book") {
                            navigate('/wish-list');
                        }
                    }
                    else {
                        alert("Nie udało się dodać żadnej książki.");
                    }
                } else {
                    alert("Nie znaleziono odpowiednich danych dla tej sekcji.");
                }
            } else {
                alert("Nieprawidłowy format pliku JSON.");
            }
        } catch (error) {
            console.error("Błąd podczas parsowania pliku JSON: ", error);
            alert("Nieprawidłowy format pliku JSON.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div>
            {mode === "add" && addBookMethod === "" && (
                <div className='add-book-method-container'>
                    <h3>Wybierz metodę dodawania książki</h3>
                    <div className='add-book-method-buttons'>
                        <button onClick={() => setAddBookMethod("manual")}>
                            Manualnie
                        </button>
                        <button onClick={() => setAddBookMethod("isbn")}>
                            Za pomocą ISBN
                        </button>
                        <button onClick={() => setAddBookMethod("json")}>
                            Z pliku JSON
                        </button>
                        <button onClick={() =>
                        {
                            if(location.pathname === "/bc-add-book")
                            {
                                navigate("/book-collection");
                            }
                            else if(location.pathname === "/wl-add-book")
                            {
                                navigate("/wish-list");
                            }
                        }}>
                            Anuluj
                        </button>
                    </div>
                </div>
            )}
            {(mode === "edit" || (mode === "add" && addBookMethod !== "")) && (
                <div className="add-book-container">
                    <div className="add-book-form">
                        <h2>{mode === "edit" ? "Edytuj książkę" : "Dodaj książkę"}</h2>
                        <form onSubmit={handleSubmit}>
                            {addBookMethod === "json" && (
                                <>
                                    <div className="add-book-row">
                                        <label>
                                            JSON (wybierz plik):
                                            <input
                                                type="file"
                                                id='file'
                                                name='file'
                                                accept="application/json"
                                                disabled={isProcessing}
                                                onChange={(e) => handleJsonFileSelect(e.target.files[0])}
                                            />
                                        </label>
                                    </div>
                                    <div className="add-book-buttons2">
                                        <button type="button" disabled={isProcessing} onClick={processJsonFile}>Dodaj książkę</button>
                                        <button type="button" disabled={isProcessing} onClick={() => {setAddBookMethod("")}}>
                                            Anuluj
                                        </button>
                                    </div>
                                </>
                            )}
                            {addBookMethod === "isbn" && (
                                <div className="add-book-row">
                                    <label>
                                        ISBN:
                                        <input
                                            type="number"
                                            id='isbn'
                                            name='isbn'
                                            value={isbn}
                                            onChange={(e) => { setISBN(e.target.value) }}
                                            required
                                            min={1000000000000}
                                            max={9999999999999}
                                        />
                                    </label>
                                    <button type="button" onClick={handleCheckISBN}>Sprawdź</button>
                                </div>
                            )}
                            {(mode === "edit" || (mode === "add" && (addBookMethod === "manual" || addBookMethod === "isbn"))) && (
                                <>
                                    <div className="add-book-row">
                                        <div>
                                            <label>
                                                Okładka (URL):
                                                <input
                                                    type="text"
                                                    id="cover"
                                                    name='cover'
                                                    value={cover}
                                                    maxLength="500"
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
                                        </div>
                                        <div className='add-book-row-actions'>
                                            <button type="button" onClick={() => setShowCover(!showCover)}>
                                                {showCover ? "Ukryj podgląd okładki" : "Pokaż podgląd okładki"}
                                            </button>
                                            <button type="button" disabled={!title.trim() || !author.trim()} onClick={() => { setShowCoverSearch(true); handleCoverSearch(); }}>
                                                Wyszukaj okładkę
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={autoFillBookInfo}
                                                disabled={loading || !title || !author}
                                                className="auto-fill-button"
                                                >
                                                {loading ? 'Uzupełnianie...' : 'Uzupełnij automatycznie'}
                                            </button>
                                        </div>
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
                                                minLength="1"
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
                                                minLength="1"
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
                                                minLength="1"
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
                                    {(mode === "edit" || (mode === "add" && addBookMethod === "manual")) && (
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
                                    )}  
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
                                        <button type="submit">{mode === "edit" ? "Edytuj książkę" : "Dodaj książkę"}</button>
                                        <button type="button" onClick={() => {
                                            if (mode === "edit") {
                                                if(location.pathname.startsWith("/bc-edit-book/"))
                                                {
                                                    navigate(`/bc-book-details/${id}`);
                                                }
                                                else if(location.pathname.startsWith("/wl-edit-book/"))
                                                {
                                                    navigate(`/wl-book-details/${id}`);
                                                }
                                            }
                                            else {
                                                setAddBookMethod("")
                                            }
                                        }}>
                                            Anuluj
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookForm;