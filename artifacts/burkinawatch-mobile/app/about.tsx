import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useColors } from '@/hooks/useColors';
import { getWebAppUrl } from '@/lib/webApp';

const sotyssiLogo = require('../assets/images/sotyssi.png');

export default function AboutScreen() {
  const colors = useColors();
  const currentYear = new Date().getFullYear();
  const webAppUrl = getWebAppUrl();

  function openWebPage(path: string) {
    if (!webAppUrl) return;
    void Linking.openURL(`${webAppUrl}${path}`);
  }

  return (
    <Screen title="À propos & aide" showBack={true}>
      <View style={styles.content}>
        
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            BurkinaWatch
          </Text>
          <Text style={[styles.heroVersion, { color: colors.mutedForeground }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.heroDescription, { color: colors.foreground }]}>
            Application citoyenne burkinabè pour la sécurité, l'information et l'entraide au quotidien.
          </Text>
        </View>

        <View style={styles.linksSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Aide & Support
          </Text>
          <View style={styles.linksList}>
            <Pressable
              onPress={() => openWebPage('/guide')}
              disabled={!webAppUrl}
              accessibilityRole="link"
              accessibilityLabel="Ouvrir le guide d’utilisation BurkinaWatch"
              style={[styles.linkItem, { backgroundColor: colors.card, borderColor: colors.border, opacity: webAppUrl ? 1 : 0.55 }]}
              testID="about-guide-link"
            >
              <View style={[styles.linkIcon, { backgroundColor: colors.muted }]}>
                <Feather name="book-open" size={18} color={colors.primary} />
              </View>
              <View style={styles.linkCopy}>
                <Text style={[styles.linkLabel, { color: colors.foreground }]}>
                  Guide d'utilisation
                </Text>
                <Text style={[styles.linkDescription, { color: colors.mutedForeground }]}>
                  Comprendre le fonctionnement et les alertes
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>

            <Pressable
              onPress={() => openWebPage('/fiabilite')}
              disabled={!webAppUrl}
              accessibilityRole="link"
              accessibilityLabel="Consulter la méthode de vérification des données"
              style={[styles.linkItem, { backgroundColor: colors.card, borderColor: colors.border, opacity: webAppUrl ? 1 : 0.55 }]}
              testID="about-reliability-link"
            >
              <View style={[styles.linkIcon, { backgroundColor: colors.muted }]}>
                <Feather name="shield" size={18} color={colors.primary} />
              </View>
              <View style={styles.linkCopy}>
                <Text style={[styles.linkLabel, { color: colors.foreground }]}>
                  Fiabilité des données
                </Text>
                <Text style={[styles.linkDescription, { color: colors.mutedForeground }]}>
                  Comment les signalements sont vérifiés
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>

            <Pressable
              onPress={() => void Linking.openURL('mailto:contact@burkinawatch.com')}
              accessibilityRole="link"
              accessibilityLabel="Contacter le support BurkinaWatch par email"
              style={[styles.linkItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              testID="about-support-link"
            >
              <View style={[styles.linkIcon, { backgroundColor: colors.muted }]}>
                <Feather name="mail" size={18} color={colors.primary} />
              </View>
              <View style={styles.linkCopy}>
                <Text style={[styles.linkLabel, { color: colors.foreground }]}>
                  Contacter le support
                </Text>
                <Text style={[styles.linkDescription, { color: colors.mutedForeground }]}>
                  Signaler un problème technique
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerMention, { color: colors.mutedForeground }]}>
            Un produit SOTYSSI
          </Text>
          <Image source={sotyssiLogo} style={styles.sotyssiLogo} resizeMode="contain" />
          <Text style={[styles.footerSignature, { color: colors.mutedForeground }]}>
            Nous Construisons ce qui connecte
          </Text>
          <Text style={[styles.footerCopyright, { color: colors.mutedForeground }]}>
            © {currentYear} BurkinaWatch. Un produit SOTYSSI.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
    paddingBottom: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  heroVersion: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  heroDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  linksSection: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  linksList: {
    gap: 10,
  },
  linkItem: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  linkIcon: {
    alignItems: 'center',
    borderRadius: 11,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  linkCopy: {
    flex: 1,
  },
  linkLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  linkDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 3,
  },
  footer: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
    paddingTop: 32,
    marginTop: 10,
  },
  footerMention: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sotyssiLogo: {
    height: 48,
    width: 48,
  },
  footerSignature: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontStyle: 'italic',
  },
  footerCopyright: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    textAlign: 'center',
  },
});
