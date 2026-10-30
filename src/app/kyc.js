import { Ionicons } from "@expo/vector-icons";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "@/api/wave";
import Button from "@/components/Button";
import Message from "@/components/Message";
import Screen from "@/components/Screen";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

const ID_TYPES = [
  { value: "cni", label: "CNI" },
  { value: "passport", label: "Passeport" },
];

// "14051998" → "14/05/1998"
function maskDate(text) {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join("/");
}

// "14/05/1998" → "1998-05-14", ou null si la date n'existe pas.
function toIsoDate(masked) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(masked);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const valid = date.getDate() === Number(dd) && date.getMonth() === Number(mm) - 1;
  return valid ? `${yyyy}-${mm}-${dd}` : null;
}

export default function KycScreen() {
  const { refreshUser, withoutLock, logout } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [idType, setIdType] = useState("cni");
  const [idNumber, setIdNumber] = useState("");
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const pickPhoto = async (fromCamera) => {
    const result = await withoutLock(async () => {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return null;
        return ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.6 });
      }
      return ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    });
    if (result && !result.canceled) setPhoto(result.assets[0]);
  };

  const submit = async () => {
    const isoDate = toIsoDate(birthDate);
    const found = {};
    if (firstName.trim().length < 2) found.first_name = "Prénom requis.";
    if (lastName.trim().length < 2) found.last_name = "Nom requis.";
    if (!isoDate) found.birth_date = "Date invalide (JJ/MM/AAAA).";
    if (idNumber.trim().length < 4) found.id_number = "Numéro de pièce requis.";
    if (!photo) found.photo = "Ajoute une photo de ta pièce.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const form = new FormData();
    form.append("first_name", firstName.trim());
    form.append("last_name", lastName.trim());
    form.append("birth_date", isoDate);
    form.append("id_type", idType);
    form.append("id_number", idNumber.trim());
    // Le fetch d'Expo n'accepte pas l'ancien format { uri, name, type } :
    // on lui donne un File, qu'il lit lui-même (nom, type MIME et contenu).
    form.append("photo", new File(photo.uri));

    setBusy(true);
    try {
      await api.submitKyc(form);
      // kyc_completed passe à true : la navigation bascule vers l'accueil.
      await refreshUser();
    } catch (err) {
      setErrors({ ...err.fields, global: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Ionicons name="shield-checkmark" size={48} color={colors.primary} style={styles.icon} />
          <Text style={styles.title}>Vérifie ton identité</Text>
          <Text style={styles.subtitle}>
            Comme dans une vraie app de paiement, on doit savoir qui possède le compte. Ton nom
            sera affiché aux personnes qui t&apos;envoient de l&apos;argent.
          </Text>

          <Field label="Prénom(s)" error={errors.first_name}>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
          </Field>
          <Field label="Nom" error={errors.last_name}>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="characters" />
          </Field>
          <Field label="Date de naissance" error={errors.birth_date}>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={(text) => setBirthDate(maskDate(text))}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
          </Field>

          <Field label="Type de pièce">
            <View style={styles.segment}>
              {ID_TYPES.map((type) => (
                <Pressable
                  key={type.value}
                  onPress={() => setIdType(type.value)}
                  style={[styles.segmentItem, idType === type.value && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, idType === type.value && styles.segmentTextActive]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Field>
          <Field label="Numéro de la pièce" error={errors.id_number}>
            <TextInput style={styles.input} value={idNumber} onChangeText={setIdNumber} autoCapitalize="characters" />
          </Field>

          <Field label="Photo de la pièce" error={errors.photo}>
            {photo && <Image source={{ uri: photo.uri }} style={styles.preview} />}
            <View style={styles.photoButtons}>
              <Button title="Prendre une photo" variant="secondary" style={styles.flex} onPress={() => pickPhoto(true)} />
              <Button title="Galerie" variant="secondary" style={styles.flex} onPress={() => pickPhoto(false)} />
            </View>
          </Field>

          <Message>{errors.global}</Message>
          <Button title="Valider mon identité" onPress={submit} loading={busy} style={styles.submit} />
          <Button title="Se déconnecter" variant="ghost" onPress={logout} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ label, error, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  icon: { alignSelf: "center" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  field: { marginTop: spacing.md },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: spacing.xs },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  fieldError: { color: colors.danger, fontSize: 13, marginTop: spacing.xs },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
  },
  segmentItem: { flex: 1, height: 42, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.white },
  segmentText: { fontWeight: "600", color: colors.textMuted },
  segmentTextActive: { color: colors.primaryDark },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  photoButtons: { flexDirection: "row", gap: spacing.sm },
  submit: { marginTop: spacing.lg },
});
