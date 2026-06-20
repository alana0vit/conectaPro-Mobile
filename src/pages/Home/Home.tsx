import React, { useRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Header from '../../components/Header';
import HeroSection from '../../components/HeroSection';
import HowItWorks from '../../components/HowItWorks';
import AppPromo from '../../components/AppPromo';
import Footer from '../../components/Footer';

export default function Home() {
  const scrollRef = useRef<ScrollView>(null);

  const scrollToHowItWorks = () => {
    scrollRef.current?.scrollTo({ y: 500, animated: true }); 
  };

  return (
    <ScrollView ref={scrollRef} style={styles.container}>
      <Header />
      <HeroSection onScrollToHowItWorks={scrollToHowItWorks} />
      <HowItWorks />
      <AppPromo />
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
