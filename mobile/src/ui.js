// Shared look of the whole mobile app: neon blue / violet / cyan glass cards.
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Modal, ActivityIndicator, StyleSheet,
  RefreshControl, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { initials } from './format';

export const C = {
  bg: '#050b3a', line: 'rgba(0,229,255,0.30)', cyan: '#00e5ff', pink: '#ff3d8b', green: '#19e3a0',
  amber: '#ffb02e', violet: '#b08cff', text: '#ffffff', dim: 'rgba(255,255,255,0.72)', faint: 'rgba(255,255,255,0.5)',
  panel: 'rgba(255,255,255,0.08)',
};
export const GRAD = ['#00e5ff', '#4f6bff', '#ff2bd6'];

export function Screen({ children, scroll = true, refreshing, onRefresh, bottom = 24, plain }) {
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: bottom }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.cyan} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, padding: 16 }}>{children}</View>
  );
  if (plain) return inner;
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#050b3a', '#0a1a8a', '#2a0b7a']} style={StyleSheet.absoluteFill} />
      <Image source={require('../assets/busbuddy-skyline.jpg')} style={s.skyline} resizeMode="cover" pointerEvents="none" />
      {inner}
    </View>
  );
}

export function Card({ children, style, glow, onPress }) {
  const body = <View style={[s.card, glow && s.glow, style]}>{children}</View>;
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

export const Row = ({ children, style, between, gap = 10, wrap }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, between && { justifyContent: 'space-between' }, style]}>{children}</View>
);

export const T = ({ children, style, dim, small, bold, color, size, numberOfLines }) => (
  <Text numberOfLines={numberOfLines} style={[{ color: color || (dim ? C.dim : C.text), fontSize: size || (small ? 13 : 15) }, bold && { fontWeight: '800' }, style]}>{children}</Text>
);

export function Title({ title, highlight, sub }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: C.text, fontSize: 28, fontWeight: '800' }}>
        {title ? `${title} ` : ''}<Text style={{ color: C.cyan }}>{highlight}</Text>
      </Text>
      {sub ? <Text style={{ color: C.dim, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

export const CardTitle = ({ icon, children, right }) => (
  <Row between style={{ marginBottom: 8 }}>
    <Row gap={8}>{icon ? <Ionicons name={icon} size={19} color={C.cyan} /> : null}<Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }}>{children}</Text></Row>
    {right}
  </Row>
);

export function Btn({ title, onPress, kind = 'primary', small, icon, disabled, busy, style }) {
  const off = disabled || busy;
  const inner = (
    <Row gap={8} style={{ justifyContent: 'center' }}>
      {busy ? <ActivityIndicator color="#fff" /> : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 15 : 18} color={kind === 'green' ? '#04261b' : '#fff'} /> : null}
          <Text style={{ color: kind === 'green' ? '#04261b' : '#fff', fontWeight: '800', fontSize: small ? 13 : 16 }}>{title}</Text>
        </>
      )}
    </Row>
  );
  const pad = { paddingVertical: small ? 8 : 14, paddingHorizontal: small ? 14 : 22 };
  const colors = kind === 'danger' ? ['#ff3d8b', '#c4147a'] : kind === 'green' ? ['#19e3a0', '#0aa876'] : GRAD;
  return (
    <Pressable onPress={onPress} disabled={off} style={[{ opacity: off ? 0.55 : 1, alignSelf: small ? 'flex-start' : 'stretch' }, style]}>
      {kind === 'ghost' ? (
        <View style={[{ borderRadius: 999, borderWidth: 1, borderColor: C.line }, pad]}>
          <Row gap={8} style={{ justifyContent: 'center' }}>
            {busy ? <ActivityIndicator color={C.cyan} /> : (
              <>
                {icon ? <Ionicons name={icon} size={small ? 15 : 18} color={C.cyan} /> : null}
                <Text style={{ color: C.cyan, fontWeight: '800', fontSize: small ? 13 : 16 }}>{title}</Text>
              </>
            )}
          </Row>
        </View>
      ) : (
        <LinearGradient colors={colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[{ borderRadius: 999 }, pad]}>{inner}</LinearGradient>
      )}
    </Pressable>
  );
}

export function Field({ icon, value, onChangeText, placeholder, secure, error, label, hint, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={[s.field, error && { borderColor: C.pink }]}>
        {icon ? <Ionicons name={icon} size={19} color={C.cyan} style={{ marginRight: 10 }} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.5)"
          secureTextEntry={!!secure && !show}
          autoCapitalize="none"
          style={{ flex: 1, color: '#fff', fontSize: 15, paddingVertical: 13 }}
          {...rest}
        />
        {secure ? (
          <Pressable onPress={() => setShow((x) => !x)} hitSlop={10}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="#fff" />
          </Pressable>
        ) : null}
      </View>
      {hint && !error ? <Text style={s.hint}>{hint}</Text> : null}
      {error ? <Text style={s.err}>{error}</Text> : null}
    </View>
  );
}

const TONES = {
  cyan: [C.cyan, 'rgba(0,229,255,0.16)'], green: [C.green, 'rgba(25,227,160,0.18)'], amber: [C.amber, 'rgba(255,176,46,0.18)'],
  pink: [C.pink, 'rgba(255,61,139,0.18)'], violet: ['#c8b0ff', 'rgba(122,44,255,0.28)'], grey: [C.dim, 'rgba(255,255,255,0.12)'],
};
const STATUS = {
  upcoming: ['Upcoming', 'cyan'], in_progress: ['In progress', 'green'], completed: ['Completed', 'violet'], cancelled: ['Cancelled', 'pink'],
  booked: ['Booked', 'cyan'], waiting: ['Waiting', 'amber'], on_board: ['On board', 'green'], exited: ['Arrived', 'violet'], no_show: ['No show', 'pink'],
  idle: ['Not travelling', 'grey'], arrived: ['Arrived', 'violet'], pending: ['Pending', 'amber'], verified: ['Verified', 'green'], rejected: ['Rejected', 'pink'],
};
export function Chip({ status, label, tone = 'cyan', onPress }) {
  const st = status ? STATUS[status] || [status, 'grey'] : [label, tone];
  const [fg, bg] = TONES[st[1]] || TONES.grey;
  const body = (
    <View style={{ backgroundColor: bg, borderColor: fg, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontWeight: '800', fontSize: 12 }}>{label || st[0]}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

export function Avatar({ name, size = 44 }) {
  return (
    <LinearGradient colors={['#00a3ff', '#7a2cff', '#ff2bd6']} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.cyan }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{initials(name)}</Text>
    </LinearGradient>
  );
}

export function Notice({ kind = 'info', children, style }) {
  const m = { info: [C.cyan, 'rgba(0,229,255,0.10)'], ok: [C.green, 'rgba(25,227,160,0.12)'], error: ['#ff8f8f', 'rgba(255,107,107,0.14)'] }[kind];
  return (
    <View style={[{ borderColor: m[0], backgroundColor: m[1], borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 }, style]}>
      <Text style={{ color: '#fff', fontSize: 14 }}>{children}</Text>
    </View>
  );
}

export const Empty = ({ emoji = '🚌', children }) => (
  <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
    <Text style={{ fontSize: 34 }}>{emoji}</Text>
    <Text style={{ color: C.dim, textAlign: 'center', marginTop: 6 }}>{children}</Text>
  </Card>
);

export const KV = ({ k, v }) => (
  <Row between style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
    <Text style={{ color: C.dim, flex: 1 }}>{k}</Text>
    <Text style={{ color: '#fff', fontWeight: '700', flex: 1.4, textAlign: 'right' }}>{v}</Text>
  </Row>
);

export function Segmented({ items, value, onChange }) {
  return (
    <Row wrap gap={8} style={{ marginBottom: 12 }}>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <Pressable key={it.value} onPress={() => onChange(it.value)}>
            {on ? (
              <LinearGradient colors={GRAD} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.tab}><Text style={s.tabOn}>{it.label}</Text></LinearGradient>
            ) : (
              <View style={[s.tab, { borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(255,255,255,0.05)' }]}><Text style={s.tabOn}>{it.label}</Text></View>
            )}
          </Pressable>
        );
      })}
    </Row>
  );
}

export function StatBox({ icon, value, label, tone = 'cyan', onPress }) {
  const fg = (TONES[tone] || TONES.cyan)[0];
  return (
    <Pressable onPress={onPress} style={{ flexGrow: 1, flexBasis: '45%' }}>
      <Card style={{ padding: 12 }}>
        <Row gap={10}>
          <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: fg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon} size={20} color={fg} />
          </View>
          <View><Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{value}</Text><Text style={{ color: C.dim, fontSize: 12 }}>{label}</Text></View>
        </Row>
      </Card>
    </Pressable>
  );
}

// bottom sheet
export function Sheet({ visible, title, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3,6,40,0.75)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={s.sheet}>
          <Row between style={{ marginBottom: 10 }}>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}><Ionicons name="close" size={26} color="#fff" /></Pressable>
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const Skeleton = () => <View style={{ height: 90, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />;

const s = StyleSheet.create({
  skyline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260, width: '100%', opacity: 0.22 },
  card: { backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
  glow: { borderColor: 'rgba(0,229,255,0.65)', shadowColor: C.cyan, shadowOpacity: 0.4, shadowRadius: 14, elevation: 6 },
  label: { color: C.dim, fontSize: 12, fontWeight: '700', marginBottom: 4, marginLeft: 6 },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 999, paddingHorizontal: 16 },
  hint: { color: C.faint, fontSize: 12, marginTop: 4, marginLeft: 10 },
  err: { color: '#ff8f8f', fontSize: 12, marginTop: 4, marginLeft: 10 },
  tab: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999 },
  tabOn: { color: '#fff', fontWeight: '800', fontSize: 14 },
  sheet: { backgroundColor: '#0c1470', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, maxHeight: '88%', borderWidth: 1, borderColor: C.line },
});
