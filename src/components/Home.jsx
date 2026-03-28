import { useState, useEffect } from 'react';

import './Home.css';

const Home = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const books = [
    {
        id: 1,
        title: "Nieśmiertelna",
        author: "Anna Ptak",
        genres: "thriller, kryminał, sensacja",
        image: "https://i.datapremiery.pl/4/000/47/457/anna-ptak-niesmiertelna-cover-okladka.jpg",
        description: "Gwendoline Edevane, kobieta obdarzona nieśmiertelnością, każdego dnia mierzy się z bólem po stracie ukochanego. Z biegiem lat stała się samotną, pełną goryczy tyranką. Krwawymi dłońmi zbudowała twierdzę zła – brytyjską mafię – by za jej murami skryć się ze swoim cierpieniem i nienawiścią do świata. Po objęciu władzy nad organizacją, zaczęła szerzyć strach wśród mieszkańców Wielkiej Brytanii. Nie wierzy w lepsze jutro. Trwa, walcząc z miażdżącym bólem, i próbuje nie postradać zmysłów. Jednak gdy Gwedoline pewnego dnia spotka dawną miłość, będzie musiała zmierzyć się z duchami przeszłości, przewartościować swoje przekonania i zadać sobie jedno kluczowe pytanie: czy ludzkie życie ma jakąkolwiek wartość? To nie jest książka o magicznej sile miłości. To opowieść o tym, jak ból zmienia ludzi w bestie. I o granicach, które jesteśmy w stanie przekroczyć w bitwie o własne człowieczeństwo.",
        releaseDate: "30 Maja 2025"
    },
    {
        id: 2,
        title: "The Lies We Steal. Hollow Boys. Tom 1",
        author: "Monty Jay",
        genres: "romans",
        image: "https://i.datapremiery.pl/4/000/47/246/monty-jay-the-lies-we-steal-hollow-boys-tom-1-cover-okladka.jpg",
        description: "Minęły miesiące od dnia, w którym staliśmy nad tamtym pustym grobem, cuchnącym spalonym ciałem i tajemnicami. Wszyscy odświętnie ubrani, jedno z nas w sukni ślubnej. Ten dzień miał być początkiem nowej przygody. Dzień, który stał się gorzkim końcem naszej zemsty. Robiliśmy rzeczy, które naznaczyły nasze dusze na wieczność. Ale nie tak to się zaczęło. Nie dla mnie. Wszystko zaczęło się tam. W miejscu tak koszmarnym, że nawiedza mnie nawet we śnie. Uniwersytecie Hollow Heights w makabrycznym, ponurym nadmorskim miasteczku Ponderosa Springs. Uczelni dla prestiżowych, bogatych dzieci otrzymujących najwyższe wykształcenie. Mieście tonącym we mgle tajemnic, przesiąkniętym korupcją i zdradą, które stały się naszym potępieniem. Ale to nie las otaczający teren ani nawet tajemnicze ukryte mauzoleum mnie prześladowały. To byli oni. Ci, którzy czaili się w nocy. Rzeczy tak nikczemne, tak pokręcone, tak złe, że stały się władcami moich koszmarów. Jeden zły ruch i wylądowałam na linii ognia. To nie jest historia o miłości, to nie jest historia pełna szczęśliwych zakończeń. Miłość po prostu rozkwitła wśród naszych smutków, w naszym bólu, w naszym strachu, w naszej krwi. Każda straszna rzecz, jaką kiedykolwiek zrobili: obserwowałyśmy ich, pomagałyśmy im i kochałyśmy ich mimo wszystko. Niektórzy uciekają od swoich potworów, my zakochałyśmy się w naszych.",
        releaseDate: "30 Maja 2025"
    },
    {
        id: 3,
        title: "Twarze",
        author: "Małgorzata Pawlak",
        genres: "literatura piękna",
        image: "https://i.datapremiery.pl/4/000/47/545/malgorzata-pawlak-twarze-cover-okladka.jpg",
        description: "Pełna żaru, napięcia i emocji opowieść o miłości rodzącej się w cieniu brutalnego świata boksu. ONA – córka legendy ringu, dziewczyna, która przysięgła sobie, że nigdy nie wróci do tego świata. ON – bezwzględny, skupiony tylko na jednym celu: zdobyć tytuł Mistrza Świata, nawet jeśli będzie musiał poświęcić wszystko. Dawni znajomi. Dwa zupełnie różne światy. Gdy ich drogi niespodziewanie się przecinają, wszystko zaczyna się od nowa – z większą siłą, głębszymi ranami i uczuciem, którego żadne z nich się nie spodziewało. Czy miłość ma szansę w świecie, gdzie każdy cios może złamać nie tylko kości, ale i serce? Czy tajemnice z przeszłości, niezaleczone rany i rodzinne dramaty nie okażą się silniejsze niż pragnienie bliskości? To historia o pasji, walce i uczuciu, które wybucha tam, gdzie miało nie być miejsca na żadne słabości. Miłość to najtrudniejszy przeciwnik. I najcenniejsze zwycięstwo.",
        releaseDate: "29 Maja 2025"
    },
    {
        id: 4,
        title: "Dawaj i bierz. Czy twój styl współpracy pozwala ci odnieść sukces",
        author: "Adam Grant",
        genres: "poradnik",
        image: "https://i.datapremiery.pl/4/000/47/422/adam-grant-dawaj-i-bierz-czy-twoj-styl-wspolpracy-pozwala-ci-odniesc-sukces-cover-okladka.jpg",
        description: "Czy pomaganie innym to przepis na porażkę? A może największe sukcesy osiągają ci, którzy nie myślą tylko o sobie? Adam Grant, czołowy ekspert w dziedzinie psychologii organizacyjnej i najwyżej oceniany profesor Wharton School, w tej przełomowej książce udowadnia, że nie rywalizacja, a mądra współpraca stanowi klucz do osiągnięcia najlepszych wyników – zarówno w biznesie, jak i w życiu zawodowym. Grant wyróżnia trzy typy ludzi i związane z nimi style współpracy: biorców, którzy koncentrują się na własnych korzyściach, transakcjonistów, dążących do równowagi w wymianie przysług, oraz dawców, którzy bezinteresownie wspierają innych. Paradoksalnie to właśnie dawcy – choć najbardziej narażeni na wypalenie i wykorzystanie – osiągają największe sukcesy, jeśli działają w sposób strategiczny. Dzięki przedstawionym w książce wnikliwym badaniom i inspirującym historiom dowiesz się, jak: budować wartościowe relacje, które przekładają się na długoterminowe korzyści, pomagać innym, nie rezygnując z własnych ambicji i celów, wykorzystać współpracę jako narzędzie do osiągania wyjątkowych wyników. Poznaj strategie, które pozwolą ci efektywnie współpracować i świadomie kształtować swoją ścieżkę zawodową. Sukces to nie tylko wynik talentu – to także sposób, w jaki działasz z innymi. Adam Grant – jeden z najwybitniejszych psychologów organizacji, wykładowca Wharton School na Uniwersytecie Pensylwanii i autor bestsellerowej książki Ukryty potencjał. Jego prace pomagają ludziom odkrywać nowe możliwości i przekraczać własne ograniczenia. Sprzedał miliony książek, a jego wykłady TED przyciągnęły ponad 30 milionów widzów. Prowadzi podcast „Re:Thinking”, w 2021 roku napisał najczęściej czytany artykuł „New York Timesa”. Doceniony przez APA i National Science Foundation, trafił na listę Fortune 40 Under 40. Ukończył Harvard, obronił doktorat na Uniwersytecie Michigan. Mieszka w Filadelfii, gdzie łączy życie rodzinne z badaniami, pisaniem i inspirowaniem innych.",
        releaseDate: "30 Maja 2025"
    }];

    useEffect(() => {
        let intervalId;
        if (!isPaused) {
        intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % books.length);
        }, 5000);
        }
        
        return () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
        };
    }, [isPaused, books.length]);

    const goToNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % books.length);
    };

    const goToPrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + books.length) % books.length);
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const togglePause = () => {
        setIsPaused(!isPaused);
    };

    return (
        <div className='home-container'>
            <h1>Aplikacja do zarządzania kolekcją książek</h1>
            <h3>
                Aplikacja służy do zarządzania wirtualną biblioteką książek, oferując szeroki zakres funkcji zarówno dla zwykłych użytkowników, jak i administratorów. Umożliwia założenie konta w sposób tradycyjny lub logowanie przy użyciu kont GitHub i Discord.
                Użytkownicy mogą dodawać książki ręcznie, przy użyciu kodu ISBN lub importując dane z pliku JSON. Każdą pozycję można przeglądać, edytować, usuwać oraz przenosić między kolekcją a listą życzeń. Dostępna jest również funkcja oceniania i recenzowania książek, co pozwala na tworzenie własnych opinii.
                Aplikacja umożliwia przeglądanie profili innych użytkowników wraz z ich statystykami. Dostępne są również płatne pakiety PREMIUM i PREMIUM+, które odblokowują dodatkowe funkcje i można je zakupić za pośrednictwem systemu Stripe.
                Panel administracyjny pozwala na zarządzanie kontami użytkowników — ich usuwanie, przeglądanie szczegółowych informacji, zmianę pakietu oraz wgląd w informacje o aplikacji, takie jak ciasteczka czy czas życia tokenów.
                W przypadku problemów dostępny jest formularz kontaktowy. Aplikacja przykłada dużą wagę do kwestii bezpieczeństwa, wdrażając odpowiednie mechanizmy ochrony danych i użytkowników.
            </h3>
            <div className="book-slider-container">
                <div className='slider-title-container'>
                    <h2>Najnowsze premiery książek</h2>
                    <button 
                        onClick={togglePause} 
                        className={isPaused ? "unpause-button" : "pause-button"}
                    >
                        {isPaused ? "▶" : "⏸"}
                    </button>
                </div>
                <div className="book-slider">
                    <div className="slider-content">
                    <button className="slider-arrow prev-arrow" onClick={goToPrev}>
                        &lt;
                    </button>
                    <div className="slider-wrapper">
                        {books.map((book, index) => (
                        <div 
                            key={book.id} 
                            className={`slider-slide ${index === currentIndex ? 'active' : ''}`}
                        >
                            <div className="book-image">
                            <img src={book.image} alt={book.title} />
                            </div>
                            <div className="book-info">
                            <h3>{book.title}</h3>
                            <h4>{book.author}</h4>
                            <p className="book-genres">{book.genres}</p>
                            <p className="book-description">{book.description}</p>
                            <p className="release-date">Premiera: {book.releaseDate}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                    
                    <button className="slider-arrow next-arrow" onClick={goToNext}>
                        &gt;
                    </button>
                    </div>
                    <div className="slider-indicators">
                    {books.map((_, index) => (
                        <button 
                            key={index}
                            className={`indicator ${index === currentIndex ? 'active' : ''}`} 
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;