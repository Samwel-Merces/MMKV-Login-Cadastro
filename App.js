import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { storage } from './src/storage/storage'; // MMKV (somente Login e Cadastro)
import { mostrarAlerta } from './src/utils/mensagem';

const APP_COLOR = '#5F47E1';
const APP_NAME = 'Samuca Sorvetto';
const STUDENT = 'SAMUEL DE SOUZA DAS MERCES';
const LOGO = require('./assets/Logo_sorvete.png');

const KEYS = {
  user: '@samuca:user',
  orders: '@samuca:orders',
  lastPayment: '@samuca:lastPayment',
  paymentData: '@samuca:paymentData',
};
const COUPON = 'SORVETE10'; // 10% de desconto
const CARD = 'Cartão de Crédito';

// [nome, preço, descrição, imagem, categoria, avaliação]
const PRODUCTS = [
  ['Casquinha de Chocolate', 8.9, 'Chocolate cremoso servido em casquinha crocante.', require('./assets/produtos/p01.png'), 'Casquinhas', 4.8],
  ['Casquinha de Morango', 8.5, 'Sorvete de morango com sabor frutado.', require('./assets/produtos/p02.png'), 'Casquinhas', 4.6],
  ['Casquinha de Baunilha', 8.0, 'Baunilha suave em casquinha crocante.', require('./assets/produtos/p03.png'), 'Casquinhas', 4.5],
  ['Copo Napolitano', 12.9, 'Chocolate, morango e baunilha no mesmo copo.', require('./assets/produtos/p04.png'), 'Copos', 4.7],
  ['Sundae de Chocolate', 15.9, 'Sorvete, calda de chocolate e confeitos.', require('./assets/produtos/p05.png'), 'Copos', 4.7],
  ['Sundae de Morango', 15.9, 'Sorvete, calda de morango e confeitos.', require('./assets/produtos/p06.png'), 'Copos', 4.6],
  ['Milk-shake de Chocolate', 18.9, 'Milk-shake encorpado de chocolate.', require('./assets/produtos/p07.png'), 'Milk-shakes', 4.9],
  ['Milk-shake de Morango', 18.9, 'Milk-shake cremoso de morango.', require('./assets/produtos/p08.png'), 'Milk-shakes', 4.7],
  ['Milk-shake de Ovomaltine', 20.9, 'Milk-shake com flocos crocantes.', require('./assets/produtos/p09.png'), 'Milk-shakes', 4.9],
  ['Açaí 300 ml', 16.9, 'Açaí gelado com banana e granola.', require('./assets/produtos/p10.png'), 'Açaí', 4.6],
  ['Açaí 500 ml', 22.9, 'Açaí grande com acompanhamentos.', require('./assets/produtos/p11.png'), 'Açaí', 4.8],
  ['Picolé de Limão', 6.0, 'Picolé refrescante de limão.', require('./assets/produtos/p12.png'), 'Picolés', 4.3],
  ['Picolé de Uva', 6.0, 'Picolé de fruta sabor uva.', require('./assets/produtos/p13.png'), 'Picolés', 4.4],
  ['Picolé de Coco', 7.0, 'Picolé cremoso de coco.', require('./assets/produtos/p14.png'), 'Picolés', 4.5],
  ['Pote Chocolate 1 L', 29.9, 'Pote de sorvete de chocolate para compartilhar.', require('./assets/produtos/p15.png'), 'Potes', 4.8],
  ['Pote Morango 1 L', 29.9, 'Pote de sorvete de morango para compartilhar.', require('./assets/produtos/p16.png'), 'Potes', 4.7],
  ['Pote Flocos 1 L', 29.9, 'Pote de sorvete de flocos para compartilhar.', require('./assets/produtos/p17.png'), 'Potes', 4.7],
  ['Banana Split', 24.9, 'Banana, três bolas, caldas e confeitos.', require('./assets/produtos/p18.png'), 'Sobremesas', 4.8],
  ['Petit Gâteau', 26.9, 'Bolo quente de chocolate com sorvete.', require('./assets/produtos/p19.png'), 'Sobremesas', 4.9],
  ['Combo Família', 49.9, 'Dois potes de 1 L e quatro casquinhas.', require('./assets/produtos/p20.png'), 'Sobremesas', 4.9],
].map((p, i) => ({ id: String(i + 1), name: p[0], price: p[1], description: p[2], image: p[3], category: p[4], rating: p[5] }));

const CATEGORIES = ['Todos', ...new Set(PRODUCTS.map((p) => p.category))];

// ---------- utilitários ----------
const money = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
const onlyDigits = (v) => v.replace(/\D/g, '');
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());
const pad = (n) => String(n).padStart(2, '0');
const timeAfter = (min) => { const d = new Date(Date.now() + min * 60000); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const maskExpiry = (v) => { const d = onlyDigits(v).slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

// nome completo: só letras, acentos, apóstrofo e espaços; mínimo 2 palavras
const isName = (v) => /^[A-Za-zÀ-ÿ' ]+$/.test(v.trim()) && v.trim().split(/\s+/).length >= 2;
// texto livre (bairro): letras, números, espaço, ponto, hífen; precisa ter ao menos uma letra
const isText = (v) => /^[A-Za-zÀ-ÿ0-9' .-]+$/.test(v.trim()) && /[A-Za-zÀ-ÿ]/.test(v);
// cidade: apenas letras
const isCity = (v) => /^[A-Za-zÀ-ÿ' .-]+$/.test(v.trim()) && /[A-Za-zÀ-ÿ]/.test(v);
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
// telefone: DDD válido (>= 11) e, se tiver 11 dígitos, o 3º dígito deve ser 9
const validPhone = (v) => {
  const d = onlyDigits(v);
  return [10, 11].includes(d.length) && Number(d.slice(0, 2)) >= 11 && (d.length === 10 || d[2] === '9');
};
const validCPF = (value) => {
  const c = onlyDigits(value);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  const digit = (n) => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(c[i]) * (n + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digit(9) === Number(c[9]) && digit(10) === Number(c[10]);
};

const payLabel = (type, data = {}) => {
  if (type === CARD) return `${CARD} • final ${data.last4} • ${data.installments}x`;
  if (type === 'PIX') return `PIX • válido até ${data.validUntil}`;
  if (type === 'Boleto') return `Boleto • vencimento ${data.dueDate}`;
  return type;
};

// ---------- componentes visuais ----------
const Header = ({ title }) => (
  <View style={styles.header}>
    <Image source={LOGO} style={styles.logo} resizeMode="contain" />
    <Text style={styles.student}>{STUDENT}</Text>
    <Text style={styles.screenTitle}>{title}</Text>
  </View>
);

const NAV_ITEMS = [['products', '🏠', 'Início'], ['cart', '🛒', 'Carrinho'], ['orders', '🧾', 'Pedidos'], ['profile', '👤', 'Perfil']];

const BottomNav = ({ active, go, count }) => (
  <View style={styles.nav}>
    {NAV_ITEMS.map(([key, icon, label]) => (
      <Pressable key={key} style={[styles.navItem, active === key && styles.navActive]} onPress={() => go(key)}>
        <Text style={styles.navIcon}>{icon}</Text>
        <Text style={styles.navText}>{key === 'cart' && count ? `${label} (${count})` : label}</Text>
      </Pressable>
    ))}
  </View>
);

const Screen = ({ title, children, toast, nav }) => (
  <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Header title={title} />
      {!!toast && <Text style={styles.notice}>{toast}</Text>}
      {children}
    </ScrollView>
    {nav && <BottomNav {...nav} />}
  </SafeAreaView>
);

const Field = ({ label, error, ...props }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput placeholderTextColor="#777" style={[styles.input, !!error && styles.inputError]} {...props} />
    {!!error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const Button = ({ title, onPress, secondary = false, disabled = false, style }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, disabled && styles.disabled, pressed && styles.pressed, style]}
  >
    <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>
  </Pressable>
);

const Link = ({ title, onPress }) => (
  <Pressable onPress={onPress} style={styles.linkWrap}><Text style={styles.link}>{title}</Text></Pressable>
);

const copyText = async (text, setMsg) => {
  try { await Clipboard.setStringAsync(text); setMsg('Código copiado!'); } catch (e) { setMsg('Não foi possível copiar.'); }
};

// ---------- app ----------
const App = () => {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [personal, setPersonal] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [address, setAddress] = useState({ cep: '', street: '', complement: '', district: '', city: '', state: '' });
  const [login, setLogin] = useState({ email: '', password: '' });
  const [recover, setRecover] = useState({ email: '', ok: null, text: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [couponText, setCouponText] = useState('');
  const [couponOk, setCouponOk] = useState(false);
  const [paymentType, setPaymentType] = useState('');
  const [paymentData, setPaymentData] = useState({});
  const [savedPay, setSavedPay] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const go = (next) => { setErrors({}); setFormError(''); setScreen(next); };

  // Lê do AsyncStorage sempre que a tela é aberta
  useEffect(() => {
    const load = async () => {
      try {
        if (screen === 'orders') {
          const saved = await AsyncStorage.getItem(KEYS.orders);
          setOrders(saved ? JSON.parse(saved) : []);
        }
        if (screen === 'payment') {
          const last = await AsyncStorage.getItem(KEYS.lastPayment);
          const data = await AsyncStorage.getItem(KEYS.paymentData);
          if (last) setPaymentType((current) => current || last);
          if (data) setSavedPay(JSON.parse(data));
        }
      } catch (e) {
        notify('Não foi possível ler os dados salvos.');
      }
    };
    load();
  }, [screen]);

  // ----- cadastro / login -----
  const validatePersonal = () => {
    const next = {};
    if (!personal.name.trim()) next.name = 'Nome obrigatório.';
    else if (!isName(personal.name)) next.name = 'Digite nome e sobrenome, apenas letras.';
    if (!isEmail(personal.email)) next.email = 'E-mail obrigatório, em formato válido.';
    if (!validPhone(personal.phone)) next.phone = 'Telefone inválido (DDD + 8 ou 9 dígitos).';
    if (personal.password.length < 6) next.password = 'A senha deve ter no mínimo 6 caracteres.';
    if (!personal.confirm || personal.confirm !== personal.password) next.confirm = 'As senhas não coincidem.';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const validateAddress = () => {
    const next = {};
    if (onlyDigits(address.cep).length !== 8) next.cep = 'CEP deve ter 8 dígitos.';
    if (!address.street.trim()) next.street = 'Informe rua e número.';
    else if (!/(\d|\bs\/?n\b)/i.test(address.street)) next.street = 'Inclua o número (ou S/N).';
    if (!address.district.trim()) next.district = 'Bairro obrigatório.';
    else if (!isText(address.district)) next.district = 'Bairro inválido.';
    if (!address.city.trim()) next.city = 'Cidade obrigatória.';
    else if (!isCity(address.city)) next.city = 'Cidade inválida (apenas letras).';
    if (!address.state.trim()) next.state = 'UF obrigatória.';
    else if (!UFS.includes(address.state.trim().toUpperCase())) next.state = 'UF inválida.';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const saveRegistration = () => {
    if (!validateAddress()) return;
    const { confirm, ...data } = personal;
    const registration = { ...data, address };
    try {
      storage.set(KEYS.user, JSON.stringify(registration)); // dados pessoais + endereço de uma só vez (MMKV)
      setLogin({ email: data.email, password: '' });
      go('login');
      notify('Cadastro concluído! Entre com seu e-mail e senha.');
      mostrarAlerta('Cadastro', 'Cadastro concluído! Entre com seu e-mail e senha.');
    } catch (e) {
      mostrarAlerta('Erro', 'Não foi possível salvar o cadastro.');
    }
  };

  const doLogin = () => {
    const next = {};
    if (!isEmail(login.email)) next.email = 'E-mail obrigatório, em formato válido.';
    if (login.password.length < 6) next.password = 'Senha obrigatória (mínimo 6 caracteres).';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    try {
      const value = storage.getString(KEYS.user);
      if (!value) return setFormError('Nenhum cadastro encontrado. Toque em "Criar conta".');
      const saved = JSON.parse(value);
      if (saved.email.toLowerCase() !== login.email.trim().toLowerCase() || saved.password !== login.password) {
        return setFormError('E-mail ou senha não conferem.');
      }
      setUser(saved);
      go('products');
    } catch (e) {
      setFormError('Não foi possível validar o login.');
    }
  };

  const sendRecoverLink = () => {
    if (!isEmail(recover.email)) return setRecover({ ...recover, ok: false, text: 'Digite um e-mail em formato válido.' });
    try {
      const value = storage.getString(KEYS.user);
      const saved = value ? JSON.parse(value) : null;
      if (saved && saved.email.toLowerCase() === recover.email.trim().toLowerCase()) {
        setRecover({ ...recover, ok: true, text: `Link de recuperação enviado para ${recover.email.trim()}.` });
      } else {
        setRecover({ ...recover, ok: false, text: 'E-mail não encontrado no cadastro.' });
      }
    } catch (e) {
      setRecover({ ...recover, ok: false, text: 'Erro ao enviar o link. Tente novamente.' });
    }
  };

  // ----- carrinho -----
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = couponOk ? subtotal * 0.1 : 0;
  const shipping = !cart.length || subtotal >= 60 ? 0 : 6.9;
  const total = subtotal - discount + shipping;

  const addToCart = (product, amount = 1) => {
    setCart((current) => current.some((i) => i.id === product.id)
      ? current.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + amount } : i))
      : [...current, { ...product, quantity: amount }]);
    notify(`${product.name} adicionado ao carrinho.`);
  };
  const changeQuantity = (id, delta) => setCart((c) => c.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)));
  const removeItem = (id) => setCart((c) => c.filter((i) => i.id !== id));

  const applyCoupon = () => {
    const code = couponText.trim().toUpperCase();
    if (!code) return setErrors({ coupon: 'Digite um cupom ou deixe em branco.' });
    if (code !== COUPON) { setCouponOk(false); return setErrors({ coupon: 'Cupom inválido.' }); }
    setErrors({});
    setCouponOk(true);
    notify('Cupom aplicado: 10% de desconto.');
  };

  // ----- pagamento / pedido -----
  const continuePayment = () => {
    if (!paymentType) return setErrors({ payment: 'Selecione uma forma de pagamento.' });
    go(paymentType === CARD ? 'card' : paymentType === 'PIX' ? 'pix' : 'boleto');
  };

  const savePayment = async (data) => {
    const full = { ...data, type: paymentType };
    try {
      await AsyncStorage.setItem(KEYS.paymentData, JSON.stringify(full));
      await AsyncStorage.setItem(KEYS.lastPayment, paymentType);
      setPaymentData(full);
      setSavedPay(full);
      go('review');
    } catch (e) {
      notify('Não foi possível gravar o pagamento.');
    }
  };

  const finishOrder = async () => {
    const eta = `hoje, até ${timeAfter(50)}`;
    const order = {
      id: String(Date.now()),
      createdAt: new Date().toLocaleString('pt-BR'),
      status: 'Pedido recebido',
      items: cart.map(({ image, ...rest }) => rest),
      subtotal,
      discount,
      shipping,
      total,
      paymentType,
      paymentInfo: payLabel(paymentType, paymentData),
      address: user?.address,
      customer: user?.name,
      eta,
    };
    try {
      const saved = await AsyncStorage.getItem(KEYS.orders);
      const updated = [order, ...(saved ? JSON.parse(saved) : [])];
      await AsyncStorage.setItem(KEYS.orders, JSON.stringify(updated));
      setSelectedOrder(order);
      setCart([]);
      setCouponText('');
      setCouponOk(false);
      go('success');
    } catch (e) {
      notify('Não foi possível gravar o pedido.');
    }
  };

  // helper (função, não componente, para não remontar os inputs a cada render)
  const wrap = (title, children, navKey) => (
    <Screen title={title} toast={toast} nav={navKey ? { active: navKey, go, count: cartCount } : null}>{children}</Screen>
  );

  const itemLines = (items) => items.map((i) => <Text key={i.id}>{i.quantity}x {i.name} • {money(i.price * i.quantity)}</Text>);

  // ---------- 1. Login ----------
  if (screen === 'login') return wrap('Login', <>
    <Text style={styles.hero}>{APP_NAME} 🍦</Text>
    <Field label="E-mail" placeholder="E-mail (obrigatório, formato válido)" value={login.email} onChangeText={(email) => setLogin({ ...login, email })} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
    <Field label="Senha" placeholder="Senha (obrigatória, mín. 6 caracteres)" value={login.password} onChangeText={(password) => setLogin({ ...login, password })} error={errors.password} secureTextEntry />
    <Button title="ENTRAR" onPress={doLogin} />
    {!!formError && <Text style={styles.error}>{formError}</Text>}
    <Text style={styles.detailText}>Ou entre com (somente as imagens):</Text>
    <View style={styles.socialRow}>
      <View style={styles.socialG}><Text style={styles.socialGText}>G</Text></View>
      <View style={styles.socialF}><Text style={styles.socialFText}>f</Text></View>
    </View>
    <Link title="Esqueci minha senha" onPress={() => { setRecover({ email: login.email, ok: null, text: '' }); go('recover'); }} />
    <Link title="Criar conta" onPress={() => go('personal')} />
  </>);

  // ---------- 2. Cadastro 1/2 ----------
  if (screen === 'personal') return wrap('Cadastro 1/2', <>
    <Text style={styles.section}>Dados pessoais</Text>
    <Field label="Nome completo" placeholder="Nome completo (obrigatório)" value={personal.name} onChangeText={(name) => setPersonal({ ...personal, name })} error={errors.name} />
    <Field label="E-mail" placeholder="E-mail (formato válido)" value={personal.email} onChangeText={(email) => setPersonal({ ...personal, email })} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
    <Field label="Telefone" placeholder="Telefone (10 ou 11 dígitos)" value={personal.phone} onChangeText={(phone) => setPersonal({ ...personal, phone: onlyDigits(phone).slice(0, 11) })} error={errors.phone} keyboardType="phone-pad" />
    <Field label="Senha" placeholder="Senha (mín. 6 caracteres)" value={personal.password} onChangeText={(password) => setPersonal({ ...personal, password })} error={errors.password} secureTextEntry />
    <Field label="Confirmar senha" placeholder="Confirmar senha (igual à senha)" value={personal.confirm} onChangeText={(confirm) => setPersonal({ ...personal, confirm })} error={errors.confirm} secureTextEntry />
    <Button title="PRÓXIMO" onPress={() => { if (validatePersonal()) go('address'); }} />
    <Link title="Já tenho conta" onPress={() => go('login')} />
  </>);

  // ---------- 3. Cadastro 2/2 ----------
  if (screen === 'address') return wrap('Cadastro 2/2', <>
    <Text style={styles.section}>Endereço</Text>
    <Field label="CEP" placeholder="CEP (obrigatório, 8 dígitos)" value={address.cep} onChangeText={(cep) => setAddress({ ...address, cep: onlyDigits(cep).slice(0, 8) })} error={errors.cep} keyboardType="numeric" />
    <Field label="Rua e número" placeholder="Rua e número (obrigatórios)" value={address.street} onChangeText={(street) => setAddress({ ...address, street })} error={errors.street} />
    <Field label="Complemento" placeholder="Complemento (opcional)" value={address.complement} onChangeText={(complement) => setAddress({ ...address, complement })} />
    <Field label="Bairro" placeholder="Bairro (obrigatório)" value={address.district} onChangeText={(district) => setAddress({ ...address, district })} error={errors.district} />
    <View style={styles.row}>
      <View style={styles.cityCol}><Field label="Cidade" placeholder="Cidade (obrigatória)" value={address.city} onChangeText={(city) => setAddress({ ...address, city })} error={errors.city} /></View>
      <View style={styles.ufCol}><Field label="UF" placeholder="UF" value={address.state} onChangeText={(state) => setAddress({ ...address, state: state.toUpperCase().slice(0, 2) })} error={errors.state} maxLength={2} autoCapitalize="characters" /></View>
    </View>
    <Button title="FINALIZAR CADASTRO" onPress={saveRegistration} />
    <Link title="Voltar" onPress={() => go('personal')} />
  </>);

  // ---------- 4. Recuperar senha ----------
  if (screen === 'recover') return wrap('Recuperar senha', <>
    <Text style={styles.section}>Recuperar senha</Text>
    <Text style={styles.detailText}>Instrução: o link será enviado por e-mail.</Text>
    <Field label="E-mail" placeholder="E-mail (obrigatório, formato válido)" value={recover.email} onChangeText={(email) => setRecover({ email, ok: null, text: '' })} autoCapitalize="none" keyboardType="email-address" />
    <Button title="ENVIAR LINK" onPress={sendRecoverLink} />
    {!!recover.text && <Text style={[styles.message, recover.ok && styles.messageOk]}>{recover.text}</Text>}
    <Link title="Voltar ao login" onPress={() => go('login')} />
  </>);

  // ---------- 5. Catálogo ----------
  if (screen === 'products') {
    const filtered = PRODUCTS.filter((p) => (category === 'Todos' || p.category === category) && p.name.toLowerCase().includes(search.trim().toLowerCase()));
    return wrap('Catálogo', <>
      <View style={styles.topRow}>
        <Text style={styles.welcome}>Olá, {user?.name?.split(' ')[0] || 'cliente'}!</Text>
        <Pressable style={styles.cartIcon} onPress={() => go('cart')}>
          <Text style={styles.cartEmoji}>🛒</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
        </Pressable>
      </View>
      <Field label="Buscar" placeholder="Busca por nome do produto" value={search} onChangeText={setSearch} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Pressable key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {!filtered.length && <Text style={styles.empty}>Nenhum produto encontrado.</Text>}
      {filtered.map((product) => (
        <Pressable key={product.id} style={styles.product} onPress={() => { setSelected(product); setQty(1); go('detail'); }}>
          <View style={styles.thumb}><Image source={product.image} style={styles.thumbImg} resizeMode="cover" /></View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.price}>{money(product.price)}</Text>
            <Button title="ADICIONAR" style={styles.smallButton} onPress={() => addToCart(product)} />
          </View>
        </Pressable>
      ))}
    </>, 'products');
  }

  // ---------- 6. Detalhes ----------
  if (screen === 'detail' && selected) return wrap('Detalhes', <>
    <Link title="← Voltar" onPress={() => go('products')} />
    <View style={styles.detailCard}>
      <View style={styles.bigImage}><Image source={selected.image} style={styles.bigImg} resizeMode="contain" /></View>
      <Text style={styles.detailTitle}>{selected.name}</Text>
      <Text style={styles.bigPrice}>{money(selected.price)}   ⭐ {selected.rating.toFixed(1)}</Text>
      <Text style={styles.cardText}>{selected.description} Preparado com ingredientes selecionados e enviado em embalagem adequada para delivery.</Text>
      <View style={styles.qtyRow}>
        <Pressable style={[styles.qtyButton, qty <= 1 && styles.disabled]} disabled={qty <= 1} onPress={() => setQty(qty - 1)}><Text style={styles.qtyText}>−</Text></Pressable>
        <Text style={styles.qtyNumber}>{qty}</Text>
        <Pressable style={styles.qtyButton} onPress={() => setQty(qty + 1)}><Text style={styles.qtyText}>+</Text></Pressable>
      </View>
    </View>
    <Button title="ADICIONAR AO CARRINHO" onPress={() => { addToCart(selected, qty); go('cart'); }} />
  </>);

  // ---------- 7. Carrinho ----------
  if (screen === 'cart') return wrap('Carrinho', <>
    <Text style={styles.section}>Meu carrinho</Text>
    {!cart.length ? (
      <>
        <Text style={styles.empty}>Seu carrinho está vazio.</Text>
        <Button title="VER PRODUTOS" onPress={() => go('products')} />
      </>
    ) : (
      <>
        {cart.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.thumb}><Image source={item.image} style={styles.thumbImg} resizeMode="cover" /></View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text>{money(item.price)} cada</Text>
              <View style={styles.qtyRow}>
                <Pressable style={styles.qtyButton} onPress={() => changeQuantity(item.id, -1)}><Text style={styles.qtyText}>−</Text></Pressable>
                <Text style={styles.qtyNumber}>{item.quantity}</Text>
                <Pressable style={styles.qtyButton} onPress={() => changeQuantity(item.id, 1)}><Text style={styles.qtyText}>+</Text></Pressable>
                <Pressable style={styles.removeButton} onPress={() => removeItem(item.id)}><Text style={styles.removeText}>Remover</Text></Pressable>
              </View>
            </View>
          </View>
        ))}
        <Field label="Cupom de desconto" placeholder="Cupom de desconto (opcional)" value={couponText} onChangeText={setCouponText} error={errors.coupon} autoCapitalize="characters" />
        <Button title="APLICAR CUPOM" secondary onPress={applyCoupon} />
        <Text style={styles.line}>Subtotal: {money(subtotal)}</Text>
        {couponOk && <Text style={styles.line}>Desconto (10%): − {money(discount)}</Text>}
        <Text style={styles.line}>Frete: {shipping ? money(shipping) : 'Grátis'}</Text>
        <Text style={styles.total}>Total: {money(total)}</Text>
        <Button title="CONTINUAR PARA O PAGAMENTO" onPress={() => go('payment')} />
      </>
    )}
  </>, 'cart');

  // ---------- 8. Pagamento ----------
  if (screen === 'payment') return wrap('Pagamento', <>
    <Text style={styles.section}>Forma de pagamento</Text>
    {!!paymentType && <Text style={styles.notice}>Forma selecionada: {paymentType}{savedPay?.type === paymentType ? ' (última utilizada)' : ''}</Text>}
    {[[CARD, '💳'], ['PIX', '📱'], ['Boleto', '🧾']].map(([type, icon]) => (
      <Pressable key={type} style={[styles.paymentOption, paymentType === type && styles.selectedOption]} onPress={() => { setPaymentType(type); setErrors({}); }}>
        <Text style={styles.paymentText}>{icon} {type}</Text>
      </Pressable>
    ))}
    <Text style={styles.total}>Total: {money(total)}</Text>
    <Button title="CONTINUAR" onPress={continuePayment} />
    {!!errors.payment && <Text style={styles.error}>{errors.payment}</Text>}
    <Link title="Voltar ao carrinho" onPress={() => go('cart')} />
  </>);

  if (screen === 'card') return <CardPayment total={total} initial={savedPay?.type === CARD ? savedPay : {}} onSave={savePayment} onBack={() => go('payment')} />;
  if (screen === 'pix') return <PixPayment total={total} onSave={savePayment} onBack={() => go('payment')} />;
  if (screen === 'boleto') return <BoletoPayment total={total} initial={savedPay?.type === 'Boleto' ? savedPay : {}} onSave={savePayment} onBack={() => go('payment')} />;

  // ---------- 12. Resumo do pedido ----------
  if (screen === 'review') return wrap('Resumo do pedido', <>
    <View style={styles.summary}>
      <Text style={styles.summaryTitle}>Itens</Text>
      {itemLines(cart)}
      <Text style={styles.summaryTitle}>Endereço de entrega</Text>
      <Text>{user?.name}</Text>
      <Text>{user?.address?.street}{user?.address?.complement ? ` - ${user.address.complement}` : ''}</Text>
      <Text>{user?.address?.district}, {user?.address?.city}/{user?.address?.state} • CEP {user?.address?.cep}</Text>
      <Text style={styles.summaryTitle}>Forma de pagamento</Text>
      <Text>{payLabel(paymentType, paymentData)}</Text>
      <Text style={styles.summaryTitle}>Valores</Text>
      <Text>Subtotal: {money(subtotal)}</Text>
      {couponOk && <Text>Desconto: − {money(discount)}</Text>}
      <Text>Frete: {shipping ? money(shipping) : 'Grátis'}</Text>
      <Text style={styles.summaryTotal}>Total: {money(total)}</Text>
    </View>
    <Button title="CONFIRMAR PEDIDO" onPress={finishOrder} />
    <Link title="Editar dados" onPress={() => go('payment')} />
  </>);

  // ---------- 13. Confirmação ----------
  if (screen === 'success' && selectedOrder) return wrap('Confirmação', <>
    <View style={styles.successBox}><Text style={styles.successIcon}>✓</Text></View>
    <Text style={styles.successTitle}>Pedido realizado com sucesso!</Text>
    <Text style={styles.detailText}>Número do pedido: #{selectedOrder.id.slice(-6)}</Text>
    <View style={styles.summary}>
      <Text style={styles.summaryTitle}>Resumo</Text>
      {itemLines(selectedOrder.items)}
      <Text style={styles.summaryTotal}>Total: {money(selectedOrder.total)}</Text>
      <Text>Previsão de entrega: {selectedOrder.eta}</Text>
    </View>
    <Button title="VER MEUS PEDIDOS" onPress={() => go('orders')} />
    <Button title="VOLTAR AO INÍCIO" secondary onPress={() => go('products')} />
  </>);

  // ---------- 14. Meus pedidos ----------
  if (screen === 'orders') return wrap('Meus pedidos', <>
    <Text style={styles.section}>Meus pedidos</Text>
    {!orders.length && <Text style={styles.empty}>Nenhum pedido realizado.</Text>}
    {[...orders].sort((a, b) => Number(b.id) - Number(a.id)).map((order) => (
      <View key={order.id} style={styles.orderCard}>
        <Text style={styles.productName}>Pedido #{order.id.slice(-6)}</Text>
        <Text>{order.createdAt} • {order.status}</Text>
        <Text style={styles.summaryTitle}>Itens</Text>
        {itemLines(order.items)}
        <Text style={styles.summaryTitle}>Forma de pagamento</Text>
        <Text>{order.paymentInfo || order.paymentType}</Text>
        <Text style={styles.price}>Total: {money(order.total)}</Text>
      </View>
    ))}
    <Button title="FAZER NOVO PEDIDO" onPress={() => go('products')} />
  </>, 'orders');

  // ---------- Perfil (menu inferior) ----------
  if (screen === 'profile') return wrap('Perfil', <>
    <View style={styles.summary}>
      <Text style={styles.summaryTitle}>Dados pessoais</Text>
      <Text>{user?.name}</Text>
      <Text>{user?.email}</Text>
      <Text>{user?.phone}</Text>
      <Text style={styles.summaryTitle}>Endereço</Text>
      <Text>{user?.address?.street}</Text>
      <Text>{user?.address?.district}, {user?.address?.city}/{user?.address?.state}</Text>
      <Text>CEP {user?.address?.cep}</Text>
    </View>
    <Button title="SAIR" secondary onPress={() => { setUser(null); setCart([]); setLogin({ email: '', password: '' }); go('login'); }} />
  </>, 'profile');

  return null;
};

// ---------- 9. Cartão de Crédito ----------
const CardPayment = ({ total, initial, onSave, onBack }) => {
  const [data, setData] = useState({ number: '', holder: initial.holder || '', expiry: initial.expiry || '', cvv: '', installments: initial.installments || '1' });
  const [errors, setErrors] = useState({});
  const set = (key, value) => setData({ ...data, [key]: value });

  const submit = () => {
    const next = {};
    if (!data.number) next.number = 'Número do cartão obrigatório.';
    else if (onlyDigits(data.number).length !== 16) next.number = 'O cartão deve ter 16 dígitos.';
    if (!data.holder.trim()) next.holder = 'Digite o nome impresso no cartão.';
    else if (!isName(data.holder)) next.holder = 'Nome inválido (apenas letras).';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiry)) next.expiry = 'Use o formato MM/AA.';
    else {
      const [mm, yy] = data.expiry.split('/').map(Number);
      if (new Date(2000 + yy, mm, 0, 23, 59, 59) < new Date()) next.expiry = 'Cartão vencido.';
    }
    if (onlyDigits(data.cvv).length !== 3) next.cvv = 'CVV deve ter 3 dígitos.';
    const n = Number(data.installments);
    if (!/^\d+$/.test(data.installments) || n < 1 || n > 12) next.installments = 'Informe de 1 a 12 parcelas.';
    setErrors(next);
    if (!Object.keys(next).length) {
      // não gravamos o número completo nem o CVV
      onSave({ holder: data.holder.trim(), last4: data.number.slice(-4), expiry: data.expiry, installments: data.installments });
    }
  };

  const n = Number(data.installments);
  return (
    <Screen title="Cartão de Crédito">
      <Text style={styles.section}>Pagamento com cartão</Text>
      <Field label="Número do cartão" placeholder="Número do cartão (16 dígitos)" value={data.number} onChangeText={(v) => set('number', onlyDigits(v).slice(0, 16))} error={errors.number} keyboardType="numeric" />
      <Field label="Nome impresso" placeholder="Nome impresso no cartão" value={data.holder} onChangeText={(v) => set('holder', v)} error={errors.holder} autoCapitalize="characters" />
      <Field label="Validade" placeholder="Validade (MM/AA)" value={data.expiry} onChangeText={(v) => set('expiry', maskExpiry(v))} error={errors.expiry} keyboardType="numeric" maxLength={5} />
      <Field label="CVV" placeholder="CVV (3 dígitos)" value={data.cvv} onChangeText={(v) => set('cvv', onlyDigits(v).slice(0, 3))} error={errors.cvv} keyboardType="numeric" secureTextEntry />
      <Field label="Parcelas" placeholder="Parcelas (1x a 12x)" value={data.installments} onChangeText={(v) => set('installments', onlyDigits(v).slice(0, 2))} error={errors.installments} keyboardType="numeric" />
      {n >= 1 && n <= 12 && <Text style={styles.line}>{n}x de {money(total / n)}</Text>}
      <Button title="REVISAR PEDIDO" onPress={submit} />
      {!!Object.keys(errors).length && <Text style={styles.error}>Corrija os campos inválidos para continuar.</Text>}
      <Link title="Voltar" onPress={onBack} />
    </Screen>
  );
};

// ---------- 10. PIX ----------
const PixPayment = ({ total, onSave, onBack }) => {
  const [code] = useState(() => `00020126SAMUCASORVETTOPIX${Date.now().toString().slice(-8)}5204000053039865802BR`);
  const [validUntil] = useState(() => timeAfter(30));
  const [msg, setMsg] = useState('');
  return (
    <Screen title="PIX">
      <Text style={styles.section}>Pagamento com PIX</Text>
      <View style={styles.qrBox}><Text style={styles.qrText}>QR Code do PIX</Text></View>
      <Text selectable style={styles.code}>{code}</Text>
      <Button title="COPIAR CÓDIGO" secondary onPress={() => copyText(code, setMsg)} />
      {!!msg && <Text style={styles.line}>{msg}</Text>}
      <Text style={styles.line}>Valor total: {money(total)}</Text>
      <Text style={styles.line}>Código válido por 30 minutos (até {validUntil}).</Text>
      <Button title="REVISAR PEDIDO" onPress={() => onSave({ pixCode: code, validUntil, status: 'Aguardando pagamento' })} />
      <Link title="Voltar" onPress={onBack} />
    </Screen>
  );
};

// ---------- 11. Boleto ----------
const BoletoPayment = ({ total, initial, onSave, onBack }) => {
  const [payer, setPayer] = useState({ name: initial.payerName || '', cpf: initial.payerCpf || '' });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [barcode] = useState(() => `34191.79001 01043.510047 91020.150008 1 ${String(Math.round(total * 100)).padStart(14, '0')}`);
  const [dueDate] = useState(() => new Date(Date.now() + 3 * 86400000).toLocaleDateString('pt-BR'));

  const submit = () => {
    const next = {};
    if (!payer.name.trim()) next.name = 'Nome do pagador obrigatório.';
    else if (!isName(payer.name)) next.name = 'Digite o nome completo do pagador (apenas letras).';
    if (!payer.cpf) next.cpf = 'CPF obrigatório.';
    else if (!validCPF(payer.cpf)) next.cpf = 'CPF inválido (11 dígitos).';
    setErrors(next);
    if (!Object.keys(next).length) onSave({ payerName: payer.name.trim(), payerCpf: onlyDigits(payer.cpf), barcode, dueDate, status: 'Aguardando pagamento' });
  };

  return (
    <Screen title="Boleto">
      <Text style={styles.section}>Pagamento com boleto</Text>
      <Field label="Nome do pagador" placeholder="Nome do pagador (obrigatório)" value={payer.name} onChangeText={(name) => setPayer({ ...payer, name })} error={errors.name} />
      <Field label="CPF do pagador" placeholder="CPF do pagador (11 dígitos)" value={payer.cpf} onChangeText={(cpf) => setPayer({ ...payer, cpf: onlyDigits(cpf).slice(0, 11) })} error={errors.cpf} keyboardType="numeric" />
      <Text selectable style={styles.code}>{barcode}</Text>
      <Button title="COPIAR CÓDIGO DE BARRAS" secondary onPress={() => copyText(barcode, setMsg)} />
      {!!msg && <Text style={styles.line}>{msg}</Text>}
      <Text style={styles.line}>Valor total: {money(total)} • Vencimento: {dueDate}</Text>
      <Button title="REVISAR PEDIDO" onPress={submit} />
      {!!Object.keys(errors).length && <Text style={styles.error}>Corrija os campos inválidos para continuar.</Text>}
      <Link title="Voltar" onPress={onBack} />
    </Screen>
  );
};

const BORDER = '#311B92';
const box = { backgroundColor: '#fff', borderWidth: 4, borderColor: BORDER, borderRadius: 5 };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLOR },
  page: { flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center', padding: 18, backgroundColor: APP_COLOR },
  header: { alignItems: 'center', marginBottom: 18 },
  logo: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff' },
  student: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  screenTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  hero: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  section: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  welcome: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  fieldWrap: { marginBottom: 12 },
  label: { color: '#fff', marginBottom: 5, fontWeight: '800' },
  // inputs: borda 4 px, arredondamento 5 px
  input: { backgroundColor: '#fff', color: '#231942', borderWidth: 4, borderColor: BORDER, borderRadius: 5, paddingHorizontal: 12, minHeight: 50, fontSize: 16 },
  inputError: { borderColor: '#FFCC00' },
  error: { color: '#FFE066', fontWeight: '800', marginTop: 4, marginBottom: 6 },
  message: { color: '#FFE066', fontWeight: '800', textAlign: 'center', marginVertical: 8 },
  messageOk: { color: '#B9F6CA' },
  row: { flexDirection: 'row', gap: 8 },
  cityCol: { flex: 3 },
  ufCol: { flex: 1 },
  button: { minHeight: 48, backgroundColor: '#FF4F81', borderWidth: 4, borderColor: '#4A1630', borderRadius: 5, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, marginVertical: 6 },
  secondaryButton: { backgroundColor: '#fff', borderColor: BORDER },
  smallButton: { minHeight: 38, marginTop: 8, marginBottom: 0 },
  buttonText: { color: '#fff', fontWeight: '900', textAlign: 'center' },
  secondaryButtonText: { color: BORDER },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  linkWrap: { alignSelf: 'center', paddingVertical: 10 },
  link: { color: '#fff', textDecorationLine: 'underline', fontWeight: '700', fontSize: 15 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 10 },
  socialG: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  socialGText: { color: '#DB4437', fontSize: 26, fontWeight: '900' },
  socialF: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1877F2', alignItems: 'center', justifyContent: 'center' },
  socialFText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cartIcon: { ...box, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  cartEmoji: { fontSize: 26 },
  badge: { position: 'absolute', top: -10, right: -10, minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#FF4F81', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  chips: { marginBottom: 12, flexGrow: 0 },
  chip: { backgroundColor: '#fff', borderWidth: 3, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  chipActive: { backgroundColor: '#FF4F81' },
  chipText: { color: BORDER, fontWeight: '800' },
  chipTextActive: { color: '#fff' },
  product: { ...box, flexDirection: 'row', padding: 12, marginBottom: 10 },
  thumb: { width: 76, height: 76, borderRadius: 5, backgroundColor: '#EDE7FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  thumbImg: { width: '100%', height: '100%', borderRadius: 5 },
  productInfo: { flex: 1 },
  productName: { color: '#2D174D', fontSize: 17, fontWeight: '900' },
  price: { color: '#D22E61', fontSize: 17, fontWeight: '900', marginTop: 4 },
  detailCard: { ...box, padding: 20, alignItems: 'center', marginBottom: 8 },
  bigImage: { width: '100%', height: 190, borderRadius: 5, backgroundColor: '#EDE7FF', alignItems: 'center', justifyContent: 'center' },
  bigImg: { width: '100%', height: '100%', borderRadius: 5 },
  detailTitle: { color: '#2D174D', fontSize: 24, fontWeight: '900', textAlign: 'center', marginVertical: 8 },
  detailText: { color: '#fff', fontSize: 16, textAlign: 'center', marginVertical: 8 },
  cardText: { color: '#44385F', fontSize: 16, textAlign: 'center', marginVertical: 6 },
  bigPrice: { color: '#D22E61', fontSize: 22, fontWeight: '900', marginTop: 4 },
  empty: { color: '#fff', textAlign: 'center', fontSize: 18, marginVertical: 24 },
  cartItem: { ...box, flexDirection: 'row', padding: 12, marginBottom: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  qtyButton: { backgroundColor: '#FF4F81', width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  qtyText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  qtyNumber: { fontSize: 18, fontWeight: '900', marginHorizontal: 12, color: '#2D174D' },
  removeButton: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 6 },
  removeText: { color: '#D22E61', fontWeight: '800', textDecorationLine: 'underline' },
  line: { color: '#fff', fontSize: 16, fontWeight: '700', marginVertical: 3 },
  total: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'right', marginVertical: 12 },
  notice: { backgroundColor: '#FFF3A6', color: '#2D174D', borderWidth: 4, borderColor: BORDER, borderRadius: 5, padding: 12, fontWeight: '800', marginBottom: 12, overflow: 'hidden' },
  paymentOption: { ...box, padding: 20, marginBottom: 12 },
  selectedOption: { backgroundColor: '#FFF3A6', borderColor: '#FF4F81' },
  paymentText: { color: '#2D174D', fontWeight: '900', fontSize: 18 },
  summary: { ...box, padding: 18, marginBottom: 8 },
  summaryTitle: { color: '#D22E61', fontSize: 17, fontWeight: '900', marginTop: 12, marginBottom: 4 },
  summaryTotal: { color: '#2D174D', fontSize: 22, fontWeight: '900', textAlign: 'right', marginVertical: 10 },
  successBox: { ...box, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successIcon: { color: '#2E9E5B', fontSize: 80, fontWeight: '900' },
  successTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', marginVertical: 8 },
  orderCard: { ...box, padding: 16, marginBottom: 12 },
  qrBox: { ...box, height: 170, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDE7FF' },
  qrText: { color: '#2D174D', fontWeight: '900', fontSize: 18 },
  code: { ...box, color: '#2D174D', padding: 14, textAlign: 'center', fontWeight: '800', marginVertical: 12 },
  nav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 4, borderTopColor: BORDER },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navActive: { backgroundColor: '#FFF3A6' },
  navIcon: { fontSize: 20 },
  navText: { color: '#2D174D', fontSize: 11, fontWeight: '800', marginTop: 2 },
});

export default App;
