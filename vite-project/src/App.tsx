import React, { useState, useEffect, useMemo, type ChangeEvent } from 'react';

// --- 1. DEFINICIONES DE TIPOS (TypeScript) ---

// Extra para productos (ej. tipo de leche, sirope)
// US-2: "los extras tienen un nombre y su costo es 0"
type Extra = {
  id: string;
  name: string;
  price: 0; // Costo es siempre 0 según US-2
};

// Producto del menú
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  prepTime: number; // en minutos (US-1)
  available: boolean; // (US-1)
  allowedExtras: Extra[]; // Personalizaciones (US-2)
};

// Item dentro del carrito
type CartItem = {
  id: string; // ID único para este item en el carrito
  product: Product;
  quantity: number;
  selectedExtras: Extra[]; // Extras elegidos por el cliente (US-2)
};

// Tipo de pedido (US-2)
type OrderType = 'dine-in' | 'takeaway';

// Pedido confirmado
type Order = {
  id: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed'; // Para el panel de personal (US-3)
  orderType: OrderType;
  createdAt: Date;
  receiptNumber: string; // Comprobante digital ("Done")
};

// Usuario del sistema
type User = {
  id: string;
  email: string;
  password: string; // En un app real, esto sería un hash
  name: string;
  role: 'client' | 'staff' | 'admin';
};

// Páginas para navegación sin router
type Page =
  | 'login'
  | 'register'
  | 'menu'
  | 'cart'
  | 'history'
  | 'staffPanel'
  | 'adminPanel'
  | 'adminProducts';

type Notification = {
  message: string;
  type: 'success' | 'error' | 'info';
} | null;

// --- 2. DATOS SIMULADOS (MOCK DATA) ---

const MOCK_EXTRAS: Extra[] = [
  { id: 'e1', name: 'Leche de Almendras', price: 0 },
  { id: 'e2', name: 'Leche Deslactosada', price: 0 },
  { id: 'e3', name: 'Sirope de Caramelo', price: 0 },
  { id: 'e4', name: 'Crema Batida', price: 0 },
  { id: 'e5', name: 'Sin Cebolla', price: 0 },
  { id: 'e6', name: 'Queso Extra', price: 0 },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Café Espresso',
    description: 'Café corto e intenso, la base de todo.',
    price: 2.5,
    imageUrl: 'https://placehold.co/600x400/D29961/FFF?text=Espresso',
    category: 'Bebidas',
    prepTime: 3,
    available: true,
    allowedExtras: [MOCK_EXTRAS[1]],
  },
  {
    id: 'p2',
    name: 'Café Latte',
    description: 'Espresso suave con leche vaporizada.',
    price: 3.5,
    imageUrl: 'https://placehold.co/600x400/A56A49/FFF?text=Latte',
    category: 'Bebidas',
    prepTime: 5,
    available: true,
    allowedExtras: [MOCK_EXTRAS[0], MOCK_EXTRAS[1], MOCK_EXTRAS[2], MOCK_EXTRAS[3]],
  },
  {
    id: 'p3',
    name: 'Croissant de Mantequilla',
    description: 'Hojaldre crujiente y tierno.',
    price: 2.0,
    imageUrl: 'https://placehold.co/600x400/E8B478/FFF?text=Croissant',
    category: 'Pastelería',
    prepTime: 1,
    available: true,
    allowedExtras: [],
  },
  {
    id: 'p4',
    name: 'Sándwich de Jamón y Queso',
    description: 'Clásico sándwich tostado.',
    price: 4.5,
    imageUrl: 'https://placehold.co/600x400/F0A868/FFF?text=Sandwich',
    category: 'Comida',
    prepTime: 8,
    available: true,
    allowedExtras: [MOCK_EXTRAS[4], MOCK_EXTRAS[5]],
  },
  {
    id: 'p5',
    name: 'Jugo de Naranja',
    description: 'Recién exprimido, 100% natural.',
    price: 3.0,
    imageUrl: 'https://placehold.co/600x400/FFA500/FFF?text=Jugo',
    category: 'Bebidas',
    prepTime: 4,
    available: false, // US-1: Indicador de no disponible
    allowedExtras: [],
  },
];

const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'cliente@mail.com',
    password: '123',
    name: 'Juan Cliente',
    role: 'client',
  },
  {
    id: 'u2',
    email: 'personal@mail.com',
    password: '123',
    name: 'Ana Personal',
    role: 'staff',
  },
  {
    id: 'u3',
    email: 'admin@mail.com',
    password: '123',
    name: 'Gerente Admin',
    role: 'admin',
  },
];

// --- 3. ICONOS SVG (Componentes) ---

// Icono genérico para simplificar
const Icon: React.FC<{ path: string; className?: string }> = ({
  path,
  className = 'w-6 h-6',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={path} />
  </svg>
);

const IconCoffee = () => (
  <Icon path="M18 8V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2M5 8h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" />
);
const IconShoppingCart = () => (
  <Icon path="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18M16 10a4 4 0 0 1-8 0" />
);
const IconUser = () => (
  <Icon path="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
);
const IconHistory = () => (
  <Icon path="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M12 8v4l2 2" />
);
const IconLogOut = () => (
  <Icon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
);
const IconPlus = () => <Icon path="M12 5v14M5 12h14" />;
const IconMinus = () => <Icon path="M5 12h14" />;
const IconTrash = () => (
  <Icon path="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
);
const IconChevronDown = () => <Icon path="m6 9 6 6 6-6" />;
const IconX = () => <Icon path="M18 6 6 18M6 6l12 12" />;
const IconClipboard = () => (
  <Icon path="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 2v4M8 2h8M12 11v4M10 13h4" />
);
const IconSettings = () => (
  <Icon path="m12.89 1.45.15 1.89A.5.5 0 0 0 13.5 4l1.94.7a.5.5 0 0 1 .59.26l1.5 2.6a.5.5 0 0 1-.1.64l-1.6 1.6a.5.5 0 0 0 0 .71l1.6 1.6a.5.5 0 0 1 .1.64l-1.5 2.6a.5.5 0 0 1-.59.26l-1.94.7a.5.5 0 0 0-.46.39l-.15 1.89a.5.5 0 0 1-.5.45h-3a.5.5 0 0 1-.5-.45l-.15-1.89a.5.5 0 0 0-.46-.39l-1.94-.7a.5.5 0 0 1-.59-.26l-1.5-2.6a.5.5 0 0 1 .1-.64l1.6-1.6a.5.5 0 0 0 0-.71l-1.6-1.6a.5.5 0 0 1-.1-.64l1.5-2.6a.5.5 0 0 1 .59-.26l1.94-.7a.5.5 0 0 0 .46-.39l.15-1.89a.5.5 0 0 1 .5-.45h3a.5.5 0 0 1 .5.45Z" />
);
const IconArchive = () => (
  <Icon path="m21 8-1.4-4.2c-.1-.5-.6-.8-1.1-.8H5.5c-.5 0-1 .3-1.1.8L3 8m18 0H3v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
);
const IconCheck = () => <Icon path="M20 6 9 17l-5-5" />;
const IconDollarSign = () => <Icon path="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />;
const IconUpload = () => <Icon path="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5-5 5 5M12 5v12" />;

// --- 4. COMPONENTES DE UI Y UTILIDADES ---

/**
 * Componente genérico de Modal
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg m-4 bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h3 className="text-xl font-semibold text-amber-950">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 rounded-full hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <IconX />
          </button>
        </div>
        {/* Contenido del Modal */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

/**
 * Componente de Notificación (Toast)
 */
const NotificationDisplay: React.FC<{ notification: Notification }> = ({
  notification,
}) => {
  if (!notification) return null;

  const baseClasses =
    'fixed bottom-5 right-5 z-50 px-6 py-4 rounded-lg shadow-xl text-white transition-all duration-300';
  const typeClasses = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[notification.type]}`}>
      {notification.message}
    </div>
  );
};

// --- 5. COMPONENTES DE PÁGINAS Y CARACTERÍSTICAS ---

/**
 * Cabecera de Navegación
 */
interface HeaderProps {
  currentUser: User | null;
  cartItemCount: number;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}
const Header: React.FC<HeaderProps> = ({
  currentUser,
  cartItemCount,
  onNavigate,
  onLogout,
}) => {
  if (!currentUser) return null; // No mostrar header en login/register

  const NavButton: React.FC<{
    page: Page;
    icon: React.ReactNode;
    label: string;
  }> = ({ page, icon, label }) => (
    <button
      onClick={() => onNavigate(page)}
      className="flex flex-col items-center p-2 text-stone-600 hover:text-amber-700 transition-colors rounded-lg hover:bg-amber-50"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-md">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('menu')}
          >
            <span className="text-2xl text-amber-700">
              <IconCoffee />
            </span>
            <span className="text-xl font-bold text-amber-950">
              MiCafé App
            </span>
          </div>

          {/* Navegación basada en Rol */}
          <nav className="flex items-center gap-2 sm:gap-4">
            {currentUser.role === 'client' && (
              <>
                <NavButton
                  page="menu"
                  icon={<IconCoffee />}
                  label="Menú"
                />
                <NavButton
                  page="history"
                  icon={<IconHistory />}
                  label="Historial"
                />
                <button
                  onClick={() => onNavigate('cart')}
                  className="relative flex flex-col items-center p-2 text-stone-600 hover:text-amber-700 transition-colors rounded-lg hover:bg-amber-50"
                >
                  <IconShoppingCart />
                  <span className="text-xs font-medium">Carrito</span>
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {currentUser.role === 'staff' && (
              <NavButton
                page="staffPanel"
                icon={<IconClipboard />}
                label="Pedidos"
              />
            )}

            {currentUser.role === 'admin' && (
              <>
                <NavButton
                  page="adminPanel"
                  icon={<IconDollarSign />}
                  label="Ventas"
                />
                <NavButton
                  page="adminProducts"
                  icon={<IconArchive />}
                  label="Productos"
                />
              </>
            )}

            {/* Logout (Visible en todas las pantallas "Done") */}
            <button
              onClick={onLogout}
              className="flex flex-col items-center p-2 text-stone-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
            >
              <IconLogOut />
              <span className="text-xs font-medium">Salir</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

/**
 * Página de Login
 */
interface LoginProps {
  onLogin: (email: string, pass: string) => void;
  onNavigate: (page: Page) => void;
  error: string | null;
}
const LoginPage: React.FC<LoginProps> = ({ onLogin, onNavigate, error }) => {
  const [email, setEmail] = useState('cliente@mail.com');
  const [password, setPassword] = useState('123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-100">
      <div className="w-full max-w-md p-8 m-4 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center">
          <span className="p-3 text-white bg-amber-700 rounded-full">
            <IconCoffee />
          </span>
          <h2 className="mt-4 text-3xl font-bold text-center text-amber-950">
            Bienvenido a MiCafé
          </h2>
          <p className="text-stone-600">Ingresa a tu cuenta para continuar</p>
        </div>

        {/* Mensaje de error ("Done") */}
        {error && (
          <div
            className="p-4 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg"
            role="alert"
          >
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-stone-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 mt-1 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 mt-1 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors shadow-md"
          >
            Ingresar
          </button>
        </form>

        <p className="text-sm text-center text-stone-600">
          ¿No tienes cuenta?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-medium text-amber-700 hover:underline"
          >
            Regístrate aquí
          </button>
        </p>

        <div className="text-xs text-center text-stone-500">
          <p>--- Cuentas de prueba ---</p>
          <p>Cliente: cliente@mail.com (123)</p>
          <p>Personal: personal@mail.com (123)</p>
          <p>Admin: admin@mail.com (123)</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Página de Registro (Simplificada)
 */
interface RegisterProps {
  onRegister: (name: string, email: string, pass: string) => void;
  onNavigate: (page: Page) => void;
  error: string | null;
}
const RegisterPage: React.FC<RegisterProps> = ({
  onRegister,
  onNavigate,
  error,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(name, email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-100">
      <div className="w-full max-w-md p-8 m-4 space-y-6 bg-white rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-amber-950">
          Crear una Cuenta
        </h2>
        {error && (
          <div
            className="p-4 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg"
            role="alert"
          >
            {error}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-stone-700"
            >
              Nombre Completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 mt-1 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="email-reg"
              className="block text-sm font-medium text-stone-700"
            >
              Email
            </label>
            <input
              id="email-reg"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 mt-1 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password-reg"
              className="block text-sm font-medium text-stone-700"
            >
              Contraseña
            </label>
            <input
              id="password-reg"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 mt-1 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors shadow-md"
          >
            Registrarse
          </button>
        </form>
        <p className="text-sm text-center text-stone-600">
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="font-medium text-amber-700 hover:underline"
          >
            Ingresa aquí
          </button>
        </p>
      </div>
    </div>
  );
};

/**
 * Tarjeta de Producto (US-1)
 */
interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
}
const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="relative">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="object-cover w-full h-48"
          onError={(e) =>
            (e.currentTarget.src =
              'https://placehold.co/600x400/CCCCCC/FFF?text=Error')
          }
        />
        {/* US-1: Indicador de no disponible */}
        {!product.available && (
          <span className="absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
            No Disponible
          </span>
        )}
        {/* US-1: Tiempo estimado */}
        <span className="absolute bottom-3 right-3 px-3 py-1 text-xs font-semibold text-amber-950 bg-white/80 backdrop-blur-sm rounded-full">
          ~{product.prepTime} min
        </span>
      </div>

      <div className="flex flex-col flex-grow p-5">
        <h3 className="text-lg font-bold text-amber-950">{product.name}</h3>
        {/* US-1: Descripción mínima */}
        <p className="mt-1 text-sm text-stone-600 flex-grow">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-4">
          {/* US-1: Precio */}
          <span className="text-xl font-bold text-amber-800">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={onAddToCart}
            disabled={!product.available}
            className="px-4 py-2 text-sm font-semibold text-white bg-amber-700 rounded-lg shadow-md hover:bg-amber-800 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {product.allowedExtras.length > 0 ? 'Personalizar' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal de Personalización de Producto (US-2)
 */
interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    selectedExtras: Extra[]
  ) => void;
}
const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);

  // Resetear estado cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedExtras([]);
    }
  }, [isOpen]);

  if (!product) return null;

  const handleExtraToggle = (extra: Extra) => {
    setSelectedExtras((prev) =>
      prev.find((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedExtras);
    onClose();
  };

  // US-2: "se actualice automáticamente el precio total"
  // En este MVP, el precio de los extras es 0, pero la lógica está lista.
  const totalPrice = (product.price + selectedExtras.reduce((sum, e) => sum + e.price, 0)) * quantity;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product.name}>
      <div className="space-y-6">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="object-cover w-full h-64 rounded-lg"
        />
        <p className="text-stone-600">{product.description}</p>

        {/* US-2: Personalizar productos (extras) */}
        {product.allowedExtras.length > 0 && (
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-amber-950">
              Personaliza tu pedido
            </legend>
            {product.allowedExtras.map((extra) => (
              <label
                key={extra.id}
                className="flex items-center p-3 space-x-3 bg-stone-50 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedExtras.some((e) => e.id === extra.id)}
                  onChange={() => handleExtraToggle(extra)}
                  className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                />
                <span className="text-stone-700">{extra.name}</span>
                <span className="ml-auto text-sm font-medium text-stone-500">
                  +${extra.price.toFixed(2)}
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {/* US-2: Elegir cantidades */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-amber-950">
            Cantidad
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex items-center justify-center w-10 h-10 text-amber-700 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors"
            >
              <IconMinus />
            </button>
            <span className="text-xl font-bold text-center w-10">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex items-center justify-center w-10 h-10 text-amber-700 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors"
            >
              <IconPlus />
            </button>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-stone-200">
          <span className="text-2xl font-bold text-amber-950">
            Total: ${totalPrice.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            className="w-full sm:w-auto px-6 py-3 font-semibold text-white bg-amber-700 rounded-lg shadow-md hover:bg-amber-800 transition-colors"
          >
            Agregar al Carrito
          </button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Página del Menú (US-1)
 */
interface MenuProps {
  products: Product[];
  onAddToCart: (
    product: Product,
    quantity: number,
    selectedExtras: Extra[]
  ) => void;
}
const MenuPage: React.FC<MenuProps> = ({ products, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const categories = useMemo(
    () => ['Todos', ...new Set(products.map((p) => p.category))],
    [products]
  );

  // US-1: Filtrar y buscar productos
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        (selectedCategory === 'Todos' || p.category === selectedCategory) &&
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm, selectedCategory]);

  const handleOpenModal = (product: Product) => {
    if (product.allowedExtras.length > 0) {
      setModalProduct(product);
    } else {
      // Si no hay extras, agregar 1 directamente
      onAddToCart(product, 1, []);
    }
  };

  return (
    <>
      <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Encabezado y Filtros */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-950 mb-2">Nuestro Menú</h1>
          <p className="text-lg text-stone-600">
            Elige tus favoritos y haz tu pedido.
          </p>
        </div>

        {/* US-1: Filtros y Búsqueda */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-20 z-10 bg-stone-50 p-4 rounded-xl shadow-sm">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 px-4 py-3 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-1/2 px-4 py-3 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 bg-white"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Grilla de Productos (Responsiva US-1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={() => handleOpenModal(product)}
            />
          ))}
          {filteredProducts.length === 0 && (
            <p className="col-span-full text-center text-stone-500 text-lg">
              No se encontraron productos que coincidan con tu búsqueda.
            </p>
          )}
        </div>
      </div>

      {/* Modal de personalización */}
      <ProductModal
        isOpen={!!modalProduct}
        onClose={() => setModalProduct(null)}
        product={modalProduct}
        onAddToCart={onAddToCart}
      />
    </>
  );
};

/**
 * Página del Carrito (US-2)
 */
interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onPlaceOrder: (orderType: OrderType) => void;
}
const CartPage: React.FC<CartProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
}) => {
  const [orderType, setOrderType] = useState<OrderType>('takeaway');

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const extrasTotal = item.selectedExtras.reduce(
        (sum, e) => sum + e.price,
        0
      );
      return total + (item.product.price + extrasTotal) * item.quantity;
    }, 0);
  }, [cart]);

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold text-amber-950 mb-8">Tu Pedido</h1>

      {/* "Done": No permitir confirmar pedido vacío */}
      {cart.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-2xl shadow-lg">
          <span className="text-6xl">🛒</span>
          <h2 className="mt-4 text-2xl font-semibold text-stone-700">
            Tu carrito está vacío
          </h2>
          <p className="text-stone-500 mt-2">
            Agrega productos desde el menú para continuar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white rounded-2xl shadow-md"
              >
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-full sm:w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-amber-950">
                    {item.product.name}
                  </h3>
                  {/* US-2: Mostrar extras seleccionados */}
                  {item.selectedExtras.length > 0 && (
                    <p className="text-sm text-stone-500">
                      Extras:{' '}
                      {item.selectedExtras.map((e) => e.name).join(', ')}
                    </p>
                  )}
                  <span className="text-md font-semibold text-amber-800">
                    ${item.product.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.id, item.quantity - 1)
                    }
                    className="flex items-center justify-center w-8 h-8 text-amber-700 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors"
                  >
                    <IconMinus />
                  </button>
                  <span className="text-lg font-bold text-center w-8">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.id, item.quantity + 1)
                    }
                    className="flex items-center justify-center w-8 h-8 text-amber-700 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors"
                  >
                    <IconPlus />
                  </button>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>

          {/* Resumen y Confirmación */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 bg-white rounded-2xl shadow-lg space-y-6">
              <h2 className="text-2xl font-semibold text-amber-950">
                Resumen del Pedido
              </h2>

              {/* US-2: Elegir para mesa o llevar */}
              <fieldset className="space-y-3">
                <legend className="text-md font-medium text-stone-700">
                  Tipo de Entrega
                </legend>
                <label className="flex items-center p-3 space-x-3 bg-stone-50 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors">
                  <input
                    type="radio"
                    name="orderType"
                    value="dine-in"
                    checked={orderType === 'dine-in'}
                    onChange={() => setOrderType('dine-in')}
                    className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-stone-700">Consumir en Mesa</span>
                </label>
                <label className="flex items-center p-3 space-x-3 bg-stone-50 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors">
                  <input
                    type="radio"
                    name="orderType"
                    value="takeaway"
                    checked={orderType === 'takeaway'}
                    onChange={() => setOrderType('takeaway')}
                    className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-stone-700">Para Llevar</span>
                </label>
              </fieldset>

              <div className="flex justify-between items-center text-lg font-semibold text-amber-950 pt-4 border-t border-stone-200">
                <span>Total:</span>
                {/* US-2: Precio total actualizado */}
                <span className="text-2xl font-bold">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>

              {/* US-2: Confirmar pedido */}
              <button
                onClick={() => onPlaceOrder(orderType)}
                className="w-full py-3 font-semibold text-white bg-amber-700 rounded-lg shadow-md hover:bg-amber-800 transition-colors"
              >
                Confirmar y Pagar
              </button>
              {/* "Done": Simulación de pago y comprobante en un solo paso */}
              <p className="text-xs text-center text-stone-500">
                El pago se procesará y se generará un comprobante digital.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Página de Historial de Pedidos ("Done")
 */
interface HistoryProps {
  orders: Order[];
  currentUserId: string;
}
const OrderHistoryPage: React.FC<HistoryProps> = ({
  orders,
  currentUserId,
}) => {
  // "Done": Mostrar últimos 10 consumos
  const userOrders = useMemo(() => {
    return orders
      .filter((o) => o.customerId === currentUserId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }, [orders, currentUserId]);

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold text-amber-950 mb-8">
        Historial de Pedidos
      </h1>
      {userOrders.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-2xl shadow-lg">
          <span className="text-6xl">🧾</span>
          <h2 className="mt-4 text-2xl font-semibold text-stone-700">
            No tienes pedidos anteriores
          </h2>
          <p className="text-stone-500 mt-2">
            Tu historial aparecerá aquí cuando realices tu primer pedido.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {userOrders.map((order) => (
            <div
              key={order.id}
              className="p-6 bg-white rounded-2xl shadow-md"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 pb-4 border-b border-stone-200">
                <div>
                  <h2 className="text-xl font-semibold text-amber-950">
                    Pedido #{order.receiptNumber}
                  </h2>
                  <p className="text-sm text-stone-500">
                    {order.createdAt.toLocaleString()} -{' '}
                    <span
                      className={`font-medium ${
                        order.status === 'completed'
                          ? 'text-green-600'
                          : 'text-orange-500'
                      }`}
                    >
                      {order.status === 'completed'
                        ? 'Completado'
                        : 'Pendiente'}
                    </span>
                  </p>
                </div>
                <span className="text-2xl font-bold text-amber-800 mt-2 sm:mt-0">
                  ${order.total.toFixed(2)}
                </span>
              </div>
              <ul className="space-y-2">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between items-center">
                    <span className="text-stone-700">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="text-stone-600">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              {/* "Done": Comprobante digital asociado */}
              <p className="text-xs text-stone-500 mt-4">
                Comprobante: {order.receiptNumber}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Panel del Personal (US-3)
 */
interface StaffProps {
  pendingOrders: Order[];
  onMarkCompleted: (orderId: string) => void;
}
const StaffPanelPage: React.FC<StaffProps> = ({
  pendingOrders,
  onMarkCompleted,
}) => {
  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold text-amber-950 mb-8">
        Pedidos Pendientes
      </h1>
      {/* US-3: Simulación de "tiempo real". Los pedidos aparecen aquí. */}
      {pendingOrders.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-2xl shadow-lg">
          <span className="text-6xl">☕</span>
          <h2 className="mt-4 text-2xl font-semibold text-stone-700">
            Todo listo por ahora
          </h2>
          <p className="text-stone-500 mt-2">
            Los nuevos pedidos aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingOrders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col p-6 bg-white rounded-2xl shadow-lg"
            >
              {/* US-3: Nombre del cliente y pedido */}
              <div className="pb-4 mb-4 border-b border-stone-200">
                <h2 className="text-2xl font-bold text-amber-950">
                  {order.customerName}
                </h2>
                <p className="text-sm text-stone-500">
                  Pedido #{order.receiptNumber} -{' '}
                  <span className="font-semibold text-blue-600">
                    {order.orderType === 'dine-in'
                      ? 'Para Mesa'
                      : 'Para Llevar'}
                  </span>
                </p>
              </div>
              <ul className="space-y-2 flex-grow">
                {order.items.map((item) => (
                  <li key={item.id} className="text-stone-700">
                    <span className="font-bold">{item.quantity}x</span>{' '}
                    {item.product.name}
                    {item.selectedExtras.length > 0 && (
                      <span className="text-xs text-stone-500 block pl-5">
                        Extras: {item.selectedExtras.map((e) => e.name).join(', ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onMarkCompleted(order.id)}
                className="w-full mt-6 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-colors"
              >
                <div className="inline-block w-5 h-5 mr-2">
                  <IconCheck />
                </div>
                Marcar como Completado
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Modal para Formulario de Producto (US-4)
 */
interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>, newImageFile: File | null) => void;
  productToEdit: Product | null;
}
const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('Bebidas');
  const [prepTime, setPrepTime] = useState(5);
  const [available, setAvailable] = useState(true);
  const [allowedExtras, setAllowedExtras] = useState<string[]>([]); // IDs de extras
  
  // US-4: Manejo de imagen
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description);
      setPrice(productToEdit.price);
      setCategory(productToEdit.category);
      setPrepTime(productToEdit.prepTime);
      setAvailable(productToEdit.available);
      setAllowedExtras(productToEdit.allowedExtras.map(e => e.id));
      setImagePreview(productToEdit.imageUrl);
      setImageFile(null);
    } else {
      // Resetear para nuevo producto
      setName('');
      setDescription('');
      setPrice(0);
      setCategory('Bebidas');
      setPrepTime(5);
      setAvailable(true);
      setAllowedExtras([]);
      setImagePreview(null);
      setImageFile(null);
    }
  }, [productToEdit, isOpen]);

  // US-4: Previsualizar imagen JPG
  useEffect(() => {
    if (!imageFile) {
      // No restaurar preview si estamos editando
      if (!productToEdit) {
         setImagePreview(null);
      }
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    // Limpiar URL al desmontar
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, productToEdit]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  
  const handleExtraToggle = (extraId: string) => {
    setAllowedExtras(prev => 
      prev.includes(extraId) 
        ? prev.filter(id => id !== extraId) 
        : [...prev, extraId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedExtras = MOCK_EXTRAS.filter(e => allowedExtras.includes(e.id));
    
    onSave(
      {
        name,
        description,
        price,
        category,
        prepTime,
        available,
        allowedExtras: resolvedExtras,
        imageUrl: imagePreview || '', // Pasamos el preview, la lógica de App se encarga
      },
      imageFile
    );
    onClose();
  };
  
  const categories = ['Bebidas', 'Pastelería', 'Comida', 'Otros'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-stone-700">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 mt-1 border border-stone-300 rounded-lg"
            required
          />
        </div>
        
        {/* US-4: Imagen (jpg) */}
        <div>
          <label className="block text-sm font-medium text-stone-700">Imagen (JPG)</label>
          <input
            type="file"
            accept="image/jpeg"
            onChange={handleImageChange}
            className="w-full mt-1 text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 mt-1 border border-stone-300 rounded-lg"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Precio ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              className="w-full px-4 py-2 mt-1 border border-stone-300 rounded-lg"
              required
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-stone-700">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-stone-300 rounded-lg bg-white"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
         <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Tiempo Prep. (min)</label>
            <input
              type="number"
              min="1"
              value={prepTime}
              onChange={(e) => setPrepTime(parseInt(e.target.value))}
              className="w-full px-4 py-2 mt-1 border border-stone-300 rounded-lg"
              required
            />
          </div>
           <div className="flex items-center pt-8">
            <input
              id="available"
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
            />
             <label htmlFor="available" className="ml-2 text-sm font-medium text-stone-700">Disponible</label>
          </div>
        </div>
        
        {/* Selector de Extras */}
        <div>
           <label className="block text-sm font-medium text-stone-700">Extras Permitidos</label>
           <div className="mt-2 grid grid-cols-2 gap-2 p-3 border border-stone-200 rounded-lg max-h-32 overflow-y-auto">
             {MOCK_EXTRAS.map(extra => (
                <label key={extra.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={allowedExtras.includes(extra.id)}
                    onChange={() => handleExtraToggle(extra.id)}
                    className="w-4 h-4 text-amber-600 rounded border-stone-300"
                  />
                  <span className="text-sm text-stone-600">{extra.name}</span>
                </label>
             ))}
           </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors shadow-md"
          >
            Guardar Producto
          </button>
        </div>
      </form>
    </Modal>
  );
};

/**
 * Página de Admin: Gestión de Productos (US-4)
 */
interface AdminProductsProps {
  products: Product[];
  onSaveProduct: (product: Omit<Product, 'id'>, newImageFile: File | null) => void;
  onUpdateProduct: (productId: string, productData: Omit<Product, 'id'>, newImageFile: File | null) => void;
  // TODO: Agregar onDelete
}
const AdminProductsPage: React.FC<AdminProductsProps> = ({ products, onSaveProduct, onUpdateProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const handleOpenNewModal = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };
  
  const handleSave = (productData: Omit<Product, 'id'>, newImageFile: File | null) => {
    if (productToEdit) {
      onUpdateProduct(productToEdit.id, productData, newImageFile);
    } else {
      onSaveProduct(productData, newImageFile);
    }
  };

  return (
    <>
      <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
          <h1 className="text-4xl font-bold text-amber-950">
            Gestión de Productos
          </h1>
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 mt-4 sm:mt-0 px-4 py-2 font-semibold text-white bg-amber-700 rounded-lg shadow-md hover:bg-amber-800 transition-colors"
          >
            <IconPlus />
            Nuevo Producto
          </button>
        </div>

        {/* Tabla de Productos */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <table className="w-full min-w-max">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase">Imagen</th>
                <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase">Nombre</th>
                <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase">Precio</th>
                <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase">Estado</th>
                <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {products.map(product => (
                <tr key={product.id}>
                  <td className="p-4">
                    <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-stone-800">{product.name}</span>
                    <span className="block text-sm text-stone-500">{product.category}</span>
                  </td>
                  <td className="p-4 font-medium text-stone-800">${product.price.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      product.available 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.available ? 'Disponible' : 'No Disponible'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    {/* Botón de eliminar (lógica no implementada) */}
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        productToEdit={productToEdit}
      />
    </>
  );
};

/**
 * Panel de Admin: Dashboard (Simplificado)
 * (Cubre "registro de pedidos y pagos realizados" de la lista inicial)
 */
interface AdminDashboardProps {
   orders: Order[];
}
const AdminPanelPage: React.FC<AdminDashboardProps> = ({ orders }) => {

  const totalSales = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.total, 0);
  }, [orders]);
  
  const completedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'completed');
  }, [orders]);

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-bold text-amber-950 mb-8">
        Panel de Administración
      </h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="p-6 bg-white rounded-2xl shadow-lg">
           <h3 className="text-sm font-semibold text-stone-500 uppercase">Ventas Totales</h3>
           <p className="text-4xl font-bold text-amber-950 mt-2">${totalSales.toFixed(2)}</p>
         </div>
         <div className="p-6 bg-white rounded-2xl shadow-lg">
           <h3 className="text-sm font-semibold text-stone-500 uppercase">Pedidos Totales</h3>
           <p className="text-4xl font-bold text-amber-950 mt-2">{orders.length}</p>
         </div>
         <div className="p-6 bg-white rounded-2xl shadow-lg">
           <h3 className="text-sm font-semibold text-stone-500 uppercase">Pedidos Completados</h3>
           <p className="text-4xl font-bold text-amber-950 mt-2">{completedOrders.length}</p>
         </div>
      </div>
      
      {/* "Registro de pedidos y pagos realizados" */}
       <h2 className="text-2xl font-semibold text-amber-950 mb-4">
        Registro de Pagos y Pedidos
      </h2>
       <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <table className="w-full min-w-max">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase">Comprobante</th>
                <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase">Cliente</th>
                <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase">Fecha</th>
                <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase">Total</th>
                <th className="p-4 text-left text-xs font-semibold text-stone-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {/* Mostrar últimos 20 pedidos */}
              {[...orders].reverse().slice(0, 20).map(order => (
                <tr key={order.id}>
                  <td className="p-4 font-medium text-amber-700">#{order.receiptNumber}</td>
                  <td className="p-4 text-stone-800">{order.customerName}</td>
                  <td className="p-4 text-stone-600">{order.createdAt.toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-stone-800">${order.total.toFixed(2)}</td>
                  <td className="p-4">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
};


// --- 6. COMPONENTE PRINCIPAL (App) ---

export default function App() {
  // --- Estado Global de la App ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification>(null);

  // Estado de "Base de Datos" simulada
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // --- Efectos ---

  // Efecto para limpiar notificaciones
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // --- Funciones de Notificación ---
  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info'
  ) => {
    setNotification({ message, type });
  };

  // --- Lógica de Autenticación y Navegación ---
  const handleLogin = (email: string, pass: string) => {
    const user = users.find((u) => u.email === email && u.password === pass);
    if (user) {
      setCurrentUser(user);
      // Redirigir según rol
      if (user.role === 'client') setCurrentPage('menu');
      if (user.role === 'staff') setCurrentPage('staffPanel');
      if (user.role === 'admin') setCurrentPage('adminPanel');
      setLoginError(null);
      showNotification(`¡Bienvenido, ${user.name}!`, 'success');
    } else {
      // "Done": Mensaje de error en login
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  const handleRegister = (name: string, email: string, pass: string) => {
    if (users.find(u => u.email === email)) {
      setLoginError('El email ya está registrado.');
      return;
    }
    const newUser: User = {
      id: `u${users.length + 1}`,
      name,
      email,
      password: pass,
      role: 'client'
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setCurrentPage('menu');
    setLoginError(null);
    showNotification(`¡Registro exitoso, ${name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('login');
    setCart([]); // Limpiar carrito al salir
    showNotification('Sesión cerrada exitosamente.', 'info');
  };

  const handleNavigate = (page: Page) => {
    // Proteger rutas
    if (!currentUser) {
      setCurrentPage('login');
      return;
    }
    
    // Restricciones de rol
    if (page.startsWith('admin') && currentUser.role !== 'admin') return;
    if (page.startsWith('staff') && currentUser.role !== 'staff') return;
    if ((page === 'menu' || page === 'cart' || page === 'history') && currentUser.role !== 'client') return;
    
    setCurrentPage(page);
  };

  // --- Lógica del Carrito (US-2) ---
  const handleAddToCart = (
    product: Product,
    quantity: number,
    selectedExtras: Extra[]
  ) => {
    // US-2: "Puedo armar más de un pedido en simultaneo"
    // (Esto se maneja permitiendo múltiples items. Si el item es idéntico, lo agrupamos)
    
    const existingItemIndex = cart.findIndex(
      (item) =>
        item.product.id === product.id &&
        JSON.stringify(item.selectedExtras.map(e => e.id).sort()) === 
        JSON.stringify(selectedExtras.map(e => e.id).sort())
    );

    if (existingItemIndex > -1) {
      // Actualizar cantidad si ya existe (mismo producto Y mismos extras)
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      // Agregar como nuevo item
      const newCartItem: CartItem = {
        id: `c${Date.now()}`,
        product,
        quantity,
        selectedExtras,
      };
      setCart((prevCart) => [...prevCart, newCartItem]);
    }
    showNotification(
      `${quantity}x ${product.name} agregado al carrito.`,
      'success'
    );
  };

  const handleUpdateCartQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Si la cantidad es 0 o menos, eliminar
      handleRemoveFromCart(cartItemId);
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));
  };

  // --- Lógica de Pedidos (US-2, US-3, "Done") ---
  const handlePlaceOrder = (orderType: OrderType) => {
    // "Done": No permitir pedido vacío
    if (cart.length === 0 || !currentUser) {
      showNotification('Tu carrito está vacío.', 'error');
      return;
    }

    const total = cart.reduce((sum, item) => {
      const extrasTotal = item.selectedExtras.reduce((s, e) => s + e.price, 0);
      return sum + (item.product.price + extrasTotal) * item.quantity;
    }, 0);
    
    const receipt = Date.now().toString().slice(-6); // Comprobante digital

    const newOrder: Order = {
      id: `o${Date.now()}`,
      customerId: currentUser.id,
      customerName: currentUser.name,
      items: [...cart],
      total,
      status: 'pending', // US-3: Llega como pendiente
      orderType,
      createdAt: new Date(),
      receiptNumber: receipt // "Done"
    };

    setOrders((prevOrders) => [...prevOrders, newOrder]);
    setCart([]); // Limpiar carrito
    
    // US-2: Mensaje de confirmación
    showNotification(
      `¡Pedido #${receipt} confirmado! Recibirás tu comprobante.`,
      'success'
    );
    setCurrentPage('history'); // Llevar al historial
  };

  // US-3: Lógica del Personal
  const handleMarkOrderCompleted = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: 'completed' } : order
      )
    );
    showNotification(`Pedido #${orders.find(o=>o.id === orderId)?.receiptNumber} completado.`, 'info');
  };

  // --- Lógica de Admin (US-4) ---
  const handleSaveProduct = (
    productData: Omit<Product, 'id'>, 
    newImageFile: File | null
  ) => {
    
    let imageUrl = 'https://placehold.co/600x400/CCCCCC/FFF?text=Nuevo';
    if (newImageFile) {
      // Simulación de subida: usamos la URL local temporal
      imageUrl = URL.createObjectURL(newImageFile);
      // Ojo: esta URL se revocará si el componente se desmonta.
      // Para una simulación más persistente, podríamos leer el archivo
      // como Base64, pero createObjectURL es más simple para el MVP.
    }
    
    const newProduct: Product = {
      ...productData,
      id: `p${Date.now()}`,
      imageUrl,
    };
    setProducts(prev => [newProduct, ...prev]);
    showNotification(`Producto "${newProduct.name}" creado.`, 'success');
  };
  
  const handleUpdateProduct = (
    productId: string, 
    productData: Omit<Product, 'id'>, 
    newImageFile: File | null
  ) => {
    
    setProducts(prev => 
      prev.map(p => {
        if (p.id === productId) {
          let imageUrl = p.imageUrl; // Mantener la original
          if (newImageFile) {
            imageUrl = URL.createObjectURL(newImageFile); // Usar la nueva
          } else if (productData.imageUrl) {
            imageUrl = productData.imageUrl; // Usar la URL (si se pasó desde el form)
          }
          
          return {
            ...p,
            ...productData,
            id: p.id, // Asegurar que el ID no cambie
            imageUrl,
          };
        }
        return p;
      })
    );
    showNotification(`Producto "${productData.name}" actualizado.`, 'success');
  };

  // --- Cálculos Derivados (Memos) ---
  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);
  
  const pendingOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [orders]);

  // --- Renderizado de Página ---
  const renderPage = () => {
    if (!currentUser) {
      switch (currentPage) {
        case 'register':
          return <RegisterPage onRegister={handleRegister} onNavigate={handleNavigate} error={loginError} />;
        case 'login':
        default:
          return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} error={loginError} />;
      }
    }

    // Vistas del usuario logueado
    switch (currentPage) {
      // Cliente
      case 'menu':
        return <MenuPage products={products} onAddToCart={handleAddToCart} />;
      case 'cart':
        return (
          <CartPage
            cart={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onPlaceOrder={handlePlaceOrder}
          />
        );
      case 'history':
        return <OrderHistoryPage orders={orders} currentUserId={currentUser.id} />;
      
      // Personal
      case 'staffPanel':
        return <StaffPanelPage pendingOrders={pendingOrders} onMarkCompleted={handleMarkOrderCompleted} />;
        
      // Admin
      case 'adminPanel':
        return <AdminPanelPage orders={orders} />;
      case 'adminProducts':
        return <AdminProductsPage 
                  products={products} 
                  onSaveProduct={handleSaveProduct} 
                  onUpdateProduct={handleUpdateProduct} 
                />;
        
      // Default (redirigir a la página principal del rol)
      default:
        if (currentUser.role === 'client') return <MenuPage products={products} onAddToCart={handleAddToCart} />;
        if (currentUser.role === 'staff') return <StaffPanelPage pendingOrders={pendingOrders} onMarkCompleted={handleMarkOrderCompleted} />;
        if (currentUser.role === 'admin') return <AdminPanelPage orders={orders} />;
        return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} error={loginError} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <Header
        currentUser={currentUser}
        cartItemCount={cartItemCount}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <main>
        {renderPage()}
      </main>
      <NotificationDisplay notification={notification} />
    </div>
  );
}