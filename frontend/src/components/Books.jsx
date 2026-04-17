import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import DoubleRangeSlider from "./DoubleRangeSlider";
import { IoMdClose } from "react-icons/io";
import { authAxios, getUsername } from '../utils/Auth';

import './Books.css';

const Books = () =>
{
    const navigate = useNavigate();
    const location = useLocation();
    const username = getUsername();
    
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortMethod, setSortMethod] = useState("idAsc");
    const [filterVisible, setFilterVisible] = useState(false);

    const PLAN_LIMITS = {
        "FREE": 50,
        "PREMIUM": 100,
        "PREMIUM+": 200
    };

    const [userPlan, setUserPlan] = useState("FREE");
    const [planLoading, setPlanLoading] = useState(true);

    const [filterCriteria, setFilterCriteria] = useState({
        genres: {},
        minPages: 0,
        maxPages: 0,
        minYear: 0,
        maxYear: 0,
    });

    const [initialBounds, setInitialBounds] = useState({
        genres: {},
        minPages: 0,
        maxPages: 0,
        minYear: 0,
        maxYear: 0,
    });

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

    const sortLabels = {
        idAsc: "ID: Rosnąco",
        idDesc: "ID: Malejąco",
        titleAsc: "Tytuł: A-Z",
        titleDesc: "Tytuł: Z-A",
        authorAsc: "Autor: A-Z",
        authorDesc: "Autor: Z-A",
        dateAsc: "Data wydania: Rosnąco",
        dateDesc: "Data wydania: Malejąco",
        pagesAsc: "Liczba stron: Rosnąco",
        pagesDesc: "Liczba stron: Malejąco",
        rateAsc: "Ocena: Rosnąco",
        rateDesc: "Ocena: Malejąco"
    };

    const sortMethods = [
        "idAsc", "idDesc",
        "titleAsc", "titleDesc",
        "authorAsc", "authorDesc",
        "dateAsc", "dateDesc",
        "pagesAsc", "pagesDesc",
        "rateAsc", "rateDesc"
    ];

    const options = sortMethods.map(method => ({
        value: method,
        label: sortLabels[method]
    }))

    const selectedOption = options.find(opt => opt.value === sortMethod)

    const [selectedBookIds, setSelectedBookIds] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL;
    
    useEffect(() => {
        setLoading(true);
        fetchBooks();
    }, [location.pathname]);

    const toggleSelectionMode = () => {
        setIsSelectionMode((prev) => {
            const next = !prev;
            if (!next) {
                clearSelection();
            }
            return next;
        });
    };

    const toggleBookSelection = (bookId) => {
        setSelectedBookIds((prev) => {
            const next = new Set(prev);
            if (next.has(bookId)) next.delete(bookId);
            else next.add(bookId);
            return next;
        });
    };

    const clearSelection = () => setSelectedBookIds(new Set());

    const selectAllVisible = () => {
        setSelectedBookIds(new Set(filteredBooks.map((b) => b.id)));
    };

    const unselectAllVisible = () => {
        setSelectedBookIds((prev) => {
            const next = new Set(prev);
            filteredBooks.forEach((b) => next.delete(b.id));
            return next;
        });
    };

    const bulkAction = async (action) => {
        if (selectedBookIds.size === 0) return;

        const ids = Array.from(selectedBookIds);
        const type = location.pathname.startsWith("/book-collection") ? "bc" : "wl";

        const confirmMsgMap = {
            remove: `Usunąć ${ids.length} wybranych książek?`,
            move: type === "bc"
                ? `Przenieść ${ids.length} wybranych książek na listę życzeń?`
                : `Przenieść ${ids.length} wybranych książek do kolekcji?`,
        };

        if (!window.confirm(confirmMsgMap[action])) return;

        try {
            if (action === "remove") {
                await Promise.all(
                    ids.map((id) => authAxios.delete(`${apiUrl}/api/remove-book/${type}/${id}`))
                );
            }

            if (action === "move") {
                await Promise.all(
                    ids.map((id) => authAxios.post(`${apiUrl}/api/move-book-to/${type}/${id}`))
                );
            }

            clearSelection();
            await fetchBooks();
        } catch (error) {
            console.error("Błąd operacji zbiorczej:", error);
        }
    };

    const fetchBooks = async () => 
    {
        try 
        {
            let response;
            const type = location.pathname.startsWith("/book-collection") ? "bc" : "wl";

            response = await authAxios.get(`${apiUrl}/api/${username}/${type}`);

            if (response.status == 200) {
                setBooks(response.data);

                const minPages = Math.min(...response.data.map(b => b.pages));
                const maxPages = Math.max(...response.data.map(b => b.pages));
                const minYear = Math.min(...response.data.map(b => {
                    const dateParts = b.date.split('-');
                    return parseInt(dateParts[2]);
                }));
                const maxYear = Math.max(...response.data.map(b => {
                    const dateParts = b.date.split('-');
                    return parseInt(dateParts[2]);
                }));

                const calculatedBounds = { minPages, maxPages, minYear, maxYear };
                setInitialBounds({ ...calculatedBounds, genres: {} });
                setFilterCriteria({
                    genres: filterCriteria.genres,
                    minPages,
                    maxPages,
                    minYear,
                    maxYear
                });

                setLoading(false);
            }
        } 
        catch (error) 
        {
            console.error('Błąd podczas ładowania książek w kolekcji/na liście życzeń: ', error);
        }
    };

    useEffect(() => {
        const fetchUserPlan = async () => {
            try {
                const response = await authAxios.get(`${apiUrl}/api/user/${username}`);
                if (response.status === 200) {
                    setUserPlan(response.data.premium || "FREE");
                }
            } catch (error) {
                console.error("Błąd podczas pobierania planu użytkownika:", error);
                setUserPlan("FREE");
            } finally {
                setPlanLoading(false);
            }
        };

        fetchUserPlan();
    }, [apiUrl, username]);

    const currentLimit = PLAN_LIMITS[userPlan] || PLAN_LIMITS.FREE;
    const currentCount = books.length;
    const canAddBook = currentCount < currentLimit;

    const handleSortClick = () => 
    {
        const currentIndex = sortMethods.indexOf(sortMethod);
        const nextIndex = (currentIndex + 1) % sortMethods.length;
        setSortMethod(sortMethods[nextIndex]);
    };

    const filteredBooks = books
    .filter(book => {
        const matchesSearch = book.title?.toLowerCase().includes(search.toLowerCase()) || book.author?.toLowerCase().includes(search.toLowerCase());
        
        const bookGenres = book.genres.toLowerCase().split(', ').map(g => g.trim());
        const selectedGenres = Object.keys(filterCriteria.genres).filter(g => filterCriteria.genres[g]);
        const genreMatch = selectedGenres.length === 0 || selectedGenres.every(g => bookGenres.includes(g));
        
        const pagesMatch = book.pages >= filterCriteria.minPages && book.pages <= filterCriteria.maxPages;

        const dateParts = book.date.split('-');
        const yearMatch = parseInt(dateParts[2]) >= filterCriteria.minYear && parseInt(dateParts[2]) <= filterCriteria.maxYear;

        return matchesSearch && genreMatch && pagesMatch && yearMatch;
    })
    .sort((a, b) => {
        switch (sortMethod) {
            case 'idAsc':
                return a.id - b.id;
            case 'idDesc':
                return b.id - a.id;
            case 'titleAsc':
                return a.title.localeCompare(b.title);
            case 'titleDesc':
                return b.title.localeCompare(a.title);
            case 'authorAsc':
                return a.author.localeCompare(b.author);
            case 'authorDesc':
                return b.author.localeCompare(a.author);
            case 'dateAsc':
                return new Date(a.date.split('-').reverse().join('-')) - new Date(b.date.split('-').reverse().join('-'));
            case 'dateDesc':
                return new Date(b.date.split('-').reverse().join('-')) - new Date(a.date.split('-').reverse().join('-'));
            case 'pagesAsc':
                return a.pages - b.pages;
            case 'pagesDesc':
                return b.pages - a.pages;
            case 'rateAsc':
                return a.rate - b.rate;
            case 'rateDesc':
                return b.rate - a.rate;
            default:
                return 0;
        }
    });

    const isSearchButtonDisabled = search.trim() === "" || books.length === 0;
    const isDisabled = books.length === 0 || filteredBooks.length === 0;

    const removeAllBooks = async () => {
        const confirmDelete = window.confirm(
            location.pathname === "/book-collection" 
            ? "Czy na pewno chcesz usunąć wszystkie książki z kolekcji?" 
            : "Czy na pewno chcesz usunąć wszystkie książki z listy życzeń?"
        );
        
        if (!confirmDelete) {
            return;
        }

        try {
            let response;
            const type = location.pathname.startsWith("/book-collection") ? "bc" : "wl";

            response = await authAxios.delete(`${apiUrl}/api/remove-all-books/${type}`);

            if (response.status === 200) {
                fetchBooks();
            }
        } catch (error) {
            console.error('Błąd podczas usuwania książki: ', error);
        }
    };

    const isDisabledResetButton = Object.keys(filterCriteria.genres).length === 0 && initialBounds.minPages === filterCriteria.minPages && initialBounds.maxPages === filterCriteria.maxPages && initialBounds.minYear === filterCriteria.minYear && initialBounds.maxYear === filterCriteria.maxYear;

    const normalizeGenres = (value) =>
        (value || "")
            .toLowerCase()
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean);

    const baseFilteredForFacets = useMemo(() => {
        return books.filter((book) => {
            const matchesSearch =
                book.title?.toLowerCase().includes(search.toLowerCase()) ||
                book.author?.toLowerCase().includes(search.toLowerCase());

            const pagesMatch =
                book.pages >= filterCriteria.minPages &&
                book.pages <= filterCriteria.maxPages;

            const dateParts = book.date.split("-");
            const year = parseInt(dateParts[2], 10);
            const yearMatch =
                year >= filterCriteria.minYear &&
                year <= filterCriteria.maxYear;

            return matchesSearch && pagesMatch && yearMatch;
        });
    }, [books, search, filterCriteria.minPages, filterCriteria.maxPages, filterCriteria.minYear, filterCriteria.maxYear]);

    const selectedGenres = useMemo(
        () => Object.keys(filterCriteria.genres).filter((g) => filterCriteria.genres[g]),
        [filterCriteria.genres]
    );

    const genreCounts = useMemo(() => {
        const counts = {};

        for (const genre of genresList) {
            const selectedWithoutCurrent = selectedGenres.filter((g) => g !== genre);

            counts[genre] = baseFilteredForFacets.filter((book) => {
                const bookGenres = normalizeGenres(book.genres);

                if (selectedWithoutCurrent.length === 0) {
                    return bookGenres.includes(genre);
                }

                const matchesOtherSelected = selectedWithoutCurrent.every((g) => bookGenres.includes(g));
                return matchesOtherSelected && bookGenres.includes(genre);
            }).length;
        }

        return counts;
    }, [genresList, selectedGenres, baseFilteredForFacets]);

    if(loading) {
        return;
    }

    return (
        <div className='book-collection'>
            {isSelectionMode && (
                <div className="bulk-actions">
                    <button
                        type="button"
                        disabled={filteredBooks.length === 0}
                        onClick={selectAllVisible}
                    >
                        Zaznacz wszystkie
                    </button>
                <button
                    type="button"
                    disabled={selectedBookIds.size === 0}
                    onClick={unselectAllVisible}
                >
                    Odznacz wybrane
                </button>
                <button
                    type="button"
                    disabled={selectedBookIds.size === 0}
                    onClick={() => bulkAction("move")}
                >
                    {location.pathname.startsWith("/book-collection")
                        ? "Przenieś wybrane do listy życzeń"
                        : "Przenieś wybrane do kolekcji"}
                </button>
                <button
                    type="button"
                    disabled={selectedBookIds.size === 0}
                    onClick={() => bulkAction("remove")}
                >
                    Usuń wybrane
                </button>
                <button disabled={books.length === 0} onClick={() => removeAllBooks()}>Usuń wszystko</button>
                <span>Wybrane: {selectedBookIds.size}</span>
            </div>)}
            <div className='book-collection-bar'>
                <div className='book-collection-bar-container1'>
                    <span>Ilość książek: {filteredBooks.length} / {currentLimit} (Plan {userPlan})</span>
                </div>
                <div className='book-collection-bar-container2'>
                    <Select
                        className="select"
                        classNamePrefix="select"
                        isDisabled={isDisabled}
                        value={selectedOption}
                        onChange={(selected) => setSortMethod(selected.value)}
                        options={options}
                        isSearchable={false}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                    />
                </div>
                <div className='book-collection-bar-container3'>
                    <input
                        type="text"
                        id="search"
                        name="search"
                        placeholder="Tytuł lub autor książki"
                        disabled={books.length === 0}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div>
                        <button
                            className="book-collection-search-button"
                            type="button"
                            disabled={isSearchButtonDisabled}
                            onClick={() => setSearch("")}
                        >
                            <IoMdClose/>
                        </button>
                    </div>
                </div>
                <div className='book-collection-bar-container4'>
                    <button disabled={books.length === 0} onClick={() => setFilterVisible((prevState) => !prevState)}>
                        {filterVisible ? "Ukryj filtry" : "Pokaż filtry"}
                    </button>
                    <button
                        type="button"
                        disabled={books.length === 0}
                        onClick={toggleSelectionMode}
                    >
                        {isSelectionMode ? "Anuluj wybieranie" : "Wybierz"}
                    </button>
                </div>
                <div className='book-collection-bar-container5'>
                    <button
                        disabled={!canAddBook || planLoading}
                        onClick={() => {
                            if (!canAddBook) return;
                            if(location.pathname === "/book-collection") {
                                navigate("/bc-add-book")
                            } else if(location.pathname === "/wish-list") {
                                navigate("/wl-add-book")
                            }
                        }}
                    >
                        Dodaj
                    </button>
                </div>
            </div>
            {filterVisible && (
            <div className="book-collection-filter">
                <div className="book-collection-filter-genres">
                    <h3>Gatunki</h3>
                    {genresList.map((genre) => (
                        <label key={genre}>
                        <input
                            type="checkbox"
                            checked={filterCriteria.genres[genre] || false}
                            disabled={
                                books.length === 0 ||
                                (!filterCriteria.genres[genre] && (genreCounts[genre] || 0) === 0)
                            }
                            onChange={(e) => {
                                const updatedGenres = { ...filterCriteria.genres };

                                if (e.target.checked) {
                                    updatedGenres[genre] = true;
                                } else {
                                    delete updatedGenres[genre];
                                }

                                setFilterCriteria({
                                    ...filterCriteria,
                                    genres: updatedGenres
                                });
                            }}
                        />
                            {genre} ({genreCounts[genre] || 0})
                        </label>
                    ))}
                </div>
                <div className="book-collection-filter-controls">
                    <h3>Liczba stron</h3>
                    <DoubleRangeSlider
                        initialBounds={initialBounds}
                        filterCriteria={filterCriteria}
                        setFilterCriteria={setFilterCriteria}
                        isDisabled={books.length === 0}
                    />
                </div>
                <div className="book-collection-filter-controls">
                    <h3>Rok wydania</h3>
                    <DoubleRangeSlider
                        initialBounds={{ minPages: initialBounds.minYear, maxPages: initialBounds.maxYear }}
                        filterCriteria={{ minPages: filterCriteria.minYear, maxPages: filterCriteria.maxYear }}
                        setFilterCriteria={(newValues) =>
                        setFilterCriteria({
                            ...filterCriteria,
                            minYear: newValues.minPages,
                            maxYear: newValues.maxPages
                        })
                        }
                        isDisabled={books.length === 0}
                    />
                </div>
                <div className="book-collection-filter-button">
                    <button disabled={isDisabledResetButton} onClick={() => setFilterCriteria(initialBounds)}>
                            Resetuj
                    </button>
                </div>
            </div>
            )}
            <div className='book-collection-container'>
                {filteredBooks.length > 0 ? (
                    filteredBooks.map((book, index) => (
                        <div className='book-card-container' style={{"--card-index": index}} key={book.id}>
                            <div className={selectedBookIds.has(book.id) ? "book-card is-selected" : "book-card"} onClick={() => {
                                    if (isSelectionMode) {
                                        toggleBookSelection(book.id);
                                        return;
                                    }
                                    if(location.pathname === "/book-collection") {
                                        navigate(`/bc-book-details/${book.id}`);
                                    } else if(location.pathname === "/wish-list") {
                                        navigate(`/wl-book-details/${book.id}`);
                                    }
                                }}>
                                {isSelectionMode && (<input
                                    className="book-card-checkbox"
                                    type="checkbox"
                                    checked={selectedBookIds.has(book.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => toggleBookSelection(book.id)}
                                />)}
                                <img
                                    src={book.cover || "/unknown.jpg"}
                                    alt={book.title}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/unknown.jpg";
                                    }}
                                    loading="lazy"
                                />
                                <p className="book-card-title">{book.id}. {book.title}</p>
                                <p className="book-card-author">{book.author}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    !loading && (
                        location.pathname === "/book-collection" ? (
                            <h3 className="no-books">Brak książek w kolekcji</h3>
                        ) : location.pathname === "/wish-list" ? (
                            <h3 className="no-books">Brak książek na liście życzeń</h3>
                        ) : null
                    )
                )}
            </div>
        </div>
    );
};

export default Books;