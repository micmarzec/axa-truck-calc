import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { CalculationResult } from '@/components/Calculator';

// Register Roboto to ensure Polish characters support (Arial-like)
Font.register({
    family: 'Arial', // Using Roboto as a working substitute for Arial with Polish support
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }
    ]
});


const styles = StyleSheet.create({
    page: {
        padding: 20,
        paddingTop: 15,
        fontSize: 9,
        fontFamily: 'Arial',
        flexDirection: 'column',
    },
    // Top Header Area
    topArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    logoImage: {
        width: 60,
        height: 60,
        objectFit: 'contain', // Ensure aspect ratio is preserved
    },
    titleSection: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },
    titleMain: {
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    titleSub: {
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    contractBox: {
        width: 120,
        height: 50,
        borderWidth: 1,
        borderColor: '#000',
        padding: 5,
    },
    contractLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 2,
    },
    contractValue: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 5,
    },

    // Main Content Sections
    sectionContainer: {
        marginBottom: 2,
    },
    sectionHeaderBox: {
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#e6e6e6', // Light gray background for headers
        padding: 3,
        paddingLeft: 5,
    },
    sectionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    sectionContentBox: {
        borderWidth: 1,
        borderTopWidth: 0, // Connect with header
        borderColor: '#000',
        padding: 5,
    },
    sectionText: {
        fontSize: 8,
        textAlign: 'justify',
        lineHeight: 1.2,
    },

    // Field Rows
    fieldRow: {
        flexDirection: 'row',
        marginBottom: 2,
        alignItems: 'flex-start', // Allow multiline text alignment
    },
    fieldLabel: {
        width: 120,
        fontSize: 9,
        flexShrink: 0, // Prevent label from shrinking
    },
    fieldValue: {
        flex: 1,
        fontSize: 9,
        fontWeight: 'bold',
        flexWrap: 'wrap', // Ensure text wraps
    },

    // Oświadczenia
    legalSection: {
        marginTop: 5,
        marginBottom: 5,
    },
    legalHeaderBox: {
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#e6e6e6',
        padding: 3,
        paddingLeft: 5,
    },
    legalContentBox: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#000',
        padding: 5,
    },
    legalPara: {
        fontSize: 8,
        marginBottom: 2,
        textAlign: 'justify',
    },
    bold: {
        fontWeight: 'bold',
    },

    // Checkboxes
    checkboxGroup: {
        marginTop: 5,
        marginLeft: 0,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    box: {
        width: 8,
        height: 8,
        borderWidth: 1,
        borderColor: '#000',
        marginRight: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },

    footerSignature: {
        marginTop: 10,
        alignSelf: 'flex-end',
        marginRight: 20,
        alignItems: 'flex-end',
    },
    axaClause: {
        fontSize: 7,
        textAlign: 'center',
        marginTop: 25,
        lineHeight: 1.2
    }
});

interface DeclarationProps {
    formData: {
        numerUmowy: string;
        firmaName: string;
        firmaUlica: string;
        firmaKod: string;
        firmaMiasto: string;
        firmaNIP: string;
        pojazdMarka: string;
        pojazdModel: string;
        pojazdVIN: string;
        pojazdRej: string;
        opcjaUbez: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any; // Allow other fields if necessary, or strict type
    };
    result: CalculationResult | null;
}

export const DeclarationDocument: React.FC<DeclarationProps> = ({ formData, result }) => {
    if (!result) return <Document><Page><Text>No Data</Text></Page></Document>;

    const val = (text: string) => text || "..........................";

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.topArea}>
                    {/* Use window.location.origin to ensure absolute URL for client-side generation, fallback to relative */}
                    <Image
                        style={styles.logoImage}
                        src={typeof window !== 'undefined' ? `${window.location.origin}/axa_logo.png` : '/axa_logo.png'}
                    // eslint-disable-next-line jsx-a11y/alt-text
                    />
                    <View style={styles.titleSection}>
                        <Text style={styles.titleMain}>Deklaracja przystąpienia do ubezpieczenia grupowego</Text>
                        <Text style={styles.titleSub}>Truck Assistance dla Klientów Pekao Leasing</Text>
                    </View>
                    <View style={styles.contractBox}>
                        <Text style={styles.contractLabel}>Numer Umowy</Text>
                        <Text style={styles.contractLabel}>Finansowania:</Text>
                        <Text style={styles.contractValue}>{formData.numerUmowy}</Text>
                    </View>
                </View>

                {/* Ubezpieczyciel */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderBox}>
                        <Text style={styles.sectionTitle}>Ubezpieczyciel</Text>
                    </View>
                    <View style={styles.sectionContentBox}>
                        <Text style={styles.sectionText}>
                            Inter Partner Assistance S.A. z siedzibą w Brukseli działająca w Polsce poprzez Inter Partner Assistance S.A. Oddział w Polsce, ul. Giełdowa 1, 01-211 Warszawa, zarejestrowany w rejestrze przedsiębiorców Krajowego Rejestru Sądowego, prowadzonym przez Sąd Rejonowy dla M. St. Warszawy w Warszawie, XIII Wydział Gospodarczy Krajowego Rejestru Sądowego pod numerem KRS 0000320749, NIP 1080006955, REGON 14168854.
                        </Text>
                    </View>
                </View>

                {/* Ubezpieczający */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderBox}>
                        <Text style={styles.sectionTitle}>Ubezpieczający</Text>
                    </View>
                    <View style={styles.sectionContentBox}>
                        <Text style={styles.sectionText}>
                            Pekao Leasing Sp. z o.o. z siedzibą w Warszawie, ul. Żubra 1, 01-066 Warszawa, Polska, zarejestrowana w rejestrze przedsiębiorców prowadzonym przez Sąd Rejonowy dla M. St. Warszawy, XIII Wydział Gospodarczy Krajowego Rejestru Sądowego pod numerem KRS: 0000000867, REGON: 430560128, NIP: 7121016682.
                        </Text>
                    </View>
                </View>

                {/* Partner */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderBox}>
                        <Text style={styles.sectionTitle}>Partner Pekao Leasing – Korzystający w rozumieniu Umowy Finansowania</Text>
                    </View>
                    <View style={styles.sectionContentBox}>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Nazwa firmy:</Text>
                            <Text style={styles.fieldValue}>{val(formData.firmaName)}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Adres:</Text>
                            <Text style={styles.fieldValue}>{val(`${formData.firmaUlica}, ${formData.firmaKod} ${formData.firmaMiasto}`)}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>NIP:</Text>
                            <Text style={styles.fieldValue}>{val(formData.firmaNIP)}</Text>
                        </View>
                    </View>
                </View>

                {/* Pojazd */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderBox}>
                        <Text style={styles.sectionTitle}>Ubezpieczony pojazd</Text>
                    </View>
                    <View style={styles.sectionContentBox}>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Marka i Model pojazdu:</Text>
                            <Text style={styles.fieldValue}>{val(`${formData.pojazdMarka} ${formData.pojazdModel}`)}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Numer VIN:</Text>
                            <Text style={styles.fieldValue}>{val(`${formData.pojazdVIN}`)}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Numer Rejestracyjny:</Text>
                            <Text style={styles.fieldValue}>{val(`${formData.pojazdRej}`)}</Text>
                        </View>
                    </View>
                </View>

                {/* Informacje o ubezpieczeniu */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderBox}>
                        <Text style={styles.sectionTitle}>Informacje o ubezpieczeniu</Text>
                    </View>
                    <View style={styles.sectionContentBox}>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Opcja ubezpieczenia:</Text>
                            <Text style={styles.fieldValue}>{formData.opcjaUbez?.toUpperCase() || "BASIC / TOP / BEST+"}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Wariant (ZESTAW):</Text>
                            <Text style={styles.fieldValue}>ZESTAW</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Długość okresu ubezpieczenia (w latach):</Text>
                            <Text style={styles.fieldValue}>{result.latCalkowite}</Text>
                        </View>
                    </View>
                </View>

                {/* Oświadczenia */}
                <View style={styles.legalSection}>
                    <View style={styles.legalHeaderBox}>
                        <Text style={styles.sectionTitle}>Oświadczenia</Text>
                    </View>
                    <View style={styles.legalContentBox}>
                        <Text style={styles.legalPara}>
                            <Text style={styles.bold}>Oświadczam, </Text>
                            że otrzymałem/otrzymałam Szczególne Warunki Ubezpieczenia Pekao Truck Assistance obowiązujących od dnia 1 czerwca 2026 r. oraz że wyrażam wolę przystąpienia do Umowy ubezpieczenia Pekao Truck Assistance w opcji ubezpieczenia zaznaczonej powyżej oraz zobowiązuję się do pokrycia kosztu składki ubezpieczeniowej.
                        </Text>
                        <Text style={styles.legalPara}>
                            <Text style={styles.bold}>Oświadczam, </Text>
                            że otrzymałem/otrzymałam Broszurę informacyjną o przetwarzaniu Danych osobowych.
                        </Text>

                        <Text style={[styles.legalPara, { marginBottom: 2 }]}>
                            <Text style={styles.bold}>Ponadto wyrażam zgodę </Text>
                            na wykorzystanie przez Ubezpieczyciela podanego przeze mnie:
                        </Text>
                        <View style={styles.checkboxGroup}>
                            <View style={styles.checkboxRow}>
                                <View style={styles.box}><Text style={{ fontSize: 7, fontWeight: 'bold' }}>{formData.zgodaEmail ? 'X' : ' '}</Text></View>
                                <Text style={{ fontSize: 8 }}>adresu e-mail</Text>
                            </View>
                            <View style={styles.checkboxRow}>
                                <View style={styles.box}><Text style={{ fontSize: 7, fontWeight: 'bold' }}>{formData.zgodaTelefon ? 'X' : ' '}</Text></View>
                                <Text style={{ fontSize: 8 }}>numeru telefonu</Text>
                            </View>
                        </View>

                        <Text style={[styles.legalPara, { marginTop: 4, marginBottom: 1 }]}>
                            <Text style={styles.bold}>do celów marketingowych </Text>
                            w celu prezentacji produktów i usług Ubezpieczyciela.
                        </Text>
                        <Text style={{ fontSize: 7, fontStyle: 'normal', marginBottom: 4 }}>
                            (w razie wyrażenia zgody marketingowej prosimy o zaznaczenie odpowiedniej odpowiedzi wpisując „X”)
                        </Text>

                        <Text style={[styles.legalPara, { marginBottom: 2 }]}>
                            <Text style={styles.bold}>Wyrażam zgodę </Text>
                            na otrzymywanie drogą elektroniczną wszelkiej korespondencji dotyczącej ubezpieczenia w tym dotyczących zgłoszenia szkód i reklamacji.
                        </Text>
                        <View style={[styles.checkboxRow, { marginTop: 2, marginLeft: 0 }]}>
                            <View style={styles.box}><Text style={{ fontSize: 7, fontWeight: 'bold' }}>{formData.zgodaKorespondencja ? 'X' : ' '}</Text></View>
                            <Text style={{ fontSize: 8, marginRight: 50 }}>TAK</Text>
                            <View style={styles.box}><Text style={{ fontSize: 7, fontWeight: 'bold' }}>{!formData.zgodaKorespondencja ? 'X' : ' '}</Text></View>
                            <Text style={{ fontSize: 8 }}>NIE</Text>
                        </View>
                    </View>
                </View>

                {/* Footer Signature */}
                <View style={styles.footerSignature}>
                    <Text>Podpis ......................................................</Text>
                </View>

                {/* AXA Clause */}
                <View style={styles.axaClause}>
                    <Text>Marka AXA Assistance należy do Grupy AXA Assistance, której członkiem jest Inter Partner Assistance S.A. z siedzibą w Brukseli</Text>
                    <Text>działającą w Polsce poprzez Inter Partner Assistance S.A. Oddział w Polsce,</Text>
                    <Text>ul. Giełdowa 1, 01-211 Warszawa, o numerze NIP 1080006955, zarejestrowany w rejestrze przedsiębiorców prowadzonym przez Sąd</Text>
                    <Text>Rejonowy dla m. st. Warszawy, XIII Wydział Gospodarczy Krajowego Rejestru Sądowego pod numerem KRS 0000320749.</Text>
                </View>

            </Page>
        </Document>
    );
};
