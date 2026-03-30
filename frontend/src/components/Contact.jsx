import { useState } from 'react';
import { authAxios } from '../utils/Auth';

import './Contact.css';

const Contact = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [text, setText] = useState("");

    const [contactMsg, setContactMsg] = useState("");

    const apiUrl = import.meta.env.VITE_API_URL;

    const onSubmit = async () => {
        try {
            const response = await authAxios.post(`${apiUrl}/api/contact`, {
                username,
                email,
                subject,
                text,
            });

            if (response.status === 200) {
                console.log("Wiadomość została wysłana pomyślnie.");
                setUsername("");
                setEmail("");
                setSubject("");
                setText("");
                setContactMsg("Wiadomość została wysłana pomyślnie.");
            }
        } catch (error) {
            console.error("Błąd podczas wysyłania wiadomości: ", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setContactMsg("");
        await onSubmit();
    };

    return (
        <div className='contact-container'>
            <h1>Kontakt</h1>
            {contactMsg && <div className="contact-message">{contactMsg}</div>}
            <div className='contact-container2'>
                <form onSubmit={handleSubmit}>
                    <div className='contact-row'>
                        <label>
                            Nazwa użytkownika
                            <input
                                type="text"
                                id="username"
                                name='username'
                                required
                                value={username}
                                minLength="5"
                                maxLength="20"
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </label>
                    </div>
                    <div className='contact-row'>
                        <label>
                            Email
                            <input
                                type="email"
                                id="email"
                                name='email'
                                required
                                value={email}
                                minLength="6"
                                maxLength="320"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </label>
                    </div>
                    <div className='contact-row'>
                        <label>
                            Temat
                            <input
                                type="text"
                                id="subject"
                                name='subject'
                                required
                                value={subject}
                                minLength="1"
                                maxLength="50"
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </label>
                    </div>
                    <div className='contact-row'>
                        <label>Wiadomość
                            <textarea
                                id="text"
                                name='text'
                                value={text}
                                required
                                minLength="1"
                                maxLength="500"
                                onChange={(e) => setText(e.target.value)}
                            />
                        </label>
                    </div>
                    <div className='contact-button'>
                        <button type="submit">Wyślij wiadomość</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Contact;