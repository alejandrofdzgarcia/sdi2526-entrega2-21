import "../assets/Header.css";
const Header = ({ onChangeView }) => {
    return (
        <header className="header">
            <h1>Gestión de Reservas</h1>
            <nav className="nav">
                <button onClick={() => onChangeView("reservations")}>
                    Mis Reservas
                </button>
                <button onClick={() => onChangeView("add")}>
                    Nueva Reserva
                </button>
                <button onClick={() => onChangeView("recurrent")}>
                    Reserva Recurrente
                </button>
                <button onClick={() => { localStorage.removeItem("token"); window.location.reload(); }}>
                    Cerrar Sesión
                </button>
            </nav>
        </header>
    );
};
export default Header;