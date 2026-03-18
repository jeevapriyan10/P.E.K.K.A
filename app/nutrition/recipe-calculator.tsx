// filepath: app/nutrition/recipe-calculator.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { addCustomFood } from '../../src/db/nutritionDb';

interface Ingredient {
  id: string;
  name: string;
  weight: number; // grams in recipe
  cal: number; // per 100g
  p: number;
  c: number;
  f: number;
}

export default function RecipeCalculatorScreen() {
  const router = useRouter();
  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  // Temp form for new ingredient
  const [ingName, setIngName] = useState('');
  const [ingWeight, setIngWeight] = useState('');
  const [ingCal, setIngCal] = useState('');
  const [ingP, setIngP] = useState('');
  const [ingC, setIngC] = useState('');
  const [ingF, setIngF] = useState('');

  const addIngredient = () => {
    if (!ingName || !ingWeight) return Alert.alert("Error", "Name and weight are required");
    const newIng: Ingredient = {
      id: Math.random().toString(),
      name: ingName,
      weight: parseFloat(ingWeight),
      cal: parseFloat(ingCal) || 0,
      p: parseFloat(ingP) || 0,
      c: parseFloat(ingC) || 0,
      f: parseFloat(ingF) || 0,
    };
    setIngredients([...ingredients, newIng]);
    // reset form
    setIngName(''); setIngWeight(''); setIngCal(''); setIngP(''); setIngC(''); setIngF('');
  };

  const totals = ingredients.reduce((acc, ing) => {
    const ratio = ing.weight / 100;
    acc.cal += ing.cal * ratio;
    acc.p += ing.p * ratio;
    acc.c += ing.c * ratio;
    acc.f += ing.f * ratio;
    acc.weight += ing.weight;
    return acc;
  }, { cal: 0, p: 0, c: 0, f: 0, weight: 0 });

  const numServings = Math.max(1, parseFloat(servings) || 1);
  const perServing = {
    cal: Math.round(totals.cal / numServings),
    p: (totals.p / numServings).toFixed(1),
    c: (totals.c / numServings).toFixed(1),
    f: (totals.f / numServings).toFixed(1),
  };

  const handleSaveAsFood = async () => {
    if (!recipeName) return Alert.alert("Error", "Please name your recipe");
    if (ingredients.length === 0) return Alert.alert("Error", "No ingredients added");

    // We save per 100g of the final recipe
    const totalWeight = totals.weight || 100;
    const ratioTo100g = 100 / totalWeight;

    await addCustomFood({
      name: `${recipeName} (Recipe)`,
      calories: totals.cal * ratioTo100g,
      protein: totals.p * ratioTo100g,
      carbs: totals.c * ratioTo100g,
      fat: totals.f * ratioTo100g,
      fiber: 0,
      barcode: ''
    });

    Alert.alert("Success", "Recipe saved to your food database!");
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>Recipe Builder</Text>
        <TouchableOpacity onPress={handleSaveAsFood}><Text style={styles.saveBtn}>Save</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <TextInput 
          style={styles.mainInput} 
          placeholder="Recipe Name (e.g. Grandma's Curry)" 
          placeholderTextColor={Colors.dark.muted}
          value={recipeName}
          onChangeText={setRecipeName}
        />

        <View style={styles.servingsRow}>
          <Text style={styles.label}>Servings:</Text>
          <TextInput 
            style={styles.servingsInput} 
            keyboardType="numeric" 
            value={servings} 
            onChangeText={setServings} 
          />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Per Serving Breakdown</Text>
          <View style={styles.macrosRow}>
             <View style={styles.macroBox}><Text style={styles.macroVal}>{perServing.cal}</Text><Text style={styles.macroLbl}>kcal</Text></View>
             <View style={styles.macroBox}><Text style={styles.macroVal}>{perServing.p}g</Text><Text style={styles.macroLbl}>prot</Text></View>
             <View style={styles.macroBox}><Text style={styles.macroVal}>{perServing.c}g</Text><Text style={styles.macroLbl}>carb</Text></View>
             <View style={styles.macroBox}><Text style={styles.macroVal}>{perServing.f}g</Text><Text style={styles.macroLbl}>fat</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        {ingredients.map(ing => (
          <View key={ing.id} style={styles.ingItem}>
            <View>
              <Text style={styles.ingName}>{ing.name}</Text>
              <Text style={styles.ingSub}>{ing.weight}g • {Math.round((ing.cal * ing.weight)/100)} kcal</Text>
            </View>
            <TouchableOpacity onPress={() => setIngredients(ingredients.filter(i => i.id !== ing.id))}>
              <Text style={{color: Colors.dark.rose}}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.addCard}>
          <Text style={styles.addTitle}>Add Ingredient</Text>
          <TextInput style={styles.input} placeholder="Ingredient Name" placeholderTextColor={Colors.dark.muted} value={ingName} onChangeText={setIngName} />
          <View style={styles.row}>
             <TextInput style={[styles.input, {flex: 1}]} placeholder="Weight (g)" keyboardType="numeric" placeholderTextColor={Colors.dark.muted} value={ingWeight} onChangeText={setIngWeight} />
             <TextInput style={[styles.input, {flex: 1}]} placeholder="Cals / 100g" keyboardType="numeric" placeholderTextColor={Colors.dark.muted} value={ingCal} onChangeText={setIngCal} />
          </View>
          <View style={styles.row}>
             <TextInput style={[styles.input, {flex: 1}]} placeholder="Prot" keyboardType="numeric" placeholderTextColor={Colors.dark.muted} value={ingP} onChangeText={setIngP} />
             <TextInput style={[styles.input, {flex: 1}]} placeholder="Carb" keyboardType="numeric" placeholderTextColor={Colors.dark.muted} value={ingC} onChangeText={setIngC} />
             <TextInput style={[styles.input, {flex: 1}]} placeholder="Fat" keyboardType="numeric" placeholderTextColor={Colors.dark.muted} value={ingF} onChangeText={setIngF} />
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
            <Text style={styles.addBtnTxt}>+ Add to Recipe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center', borderBottomWidth: 1, borderColor: Colors.dark.border },
  backBtn: { color: Colors.dark.dim, fontSize: 16 },
  saveBtn: { color: Colors.dark.lime, fontSize: 16, fontWeight: 'bold' },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 20 },
  mainInput: { fontSize: 22, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 20 },
  servingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  label: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  servingsInput: { backgroundColor: Colors.dark.bg2, color: Colors.dark.text, padding: 8, borderRadius: 8, width: 60, textAlign: 'center', borderWidth: 1, borderColor: Colors.dark.border },
  summaryCard: { backgroundColor: Colors.dark.bg2, padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.dark.lime },
  summaryTitle: { color: Colors.dark.muted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroBox: { alignItems: 'center' },
  macroVal: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  macroLbl: { color: Colors.dark.muted, fontSize: 11 },
  sectionTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  ingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: Colors.dark.bg2, borderRadius: 12, marginBottom: 10 },
  ingName: { color: Colors.dark.text, fontWeight: '600' },
  ingSub: { color: Colors.dark.muted, fontSize: 12, marginTop: 2 },
  addCard: { backgroundColor: Colors.dark.bg3, padding: 20, borderRadius: 16, marginTop: 10 },
  addTitle: { color: Colors.dark.text, fontWeight: 'bold', marginBottom: 12 },
  input: { backgroundColor: Colors.dark.bg, color: Colors.dark.text, padding: 12, borderRadius: 10, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  addBtn: { backgroundColor: Colors.dark.lime, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  addBtnTxt: { color: Colors.dark.bg, fontWeight: 'bold' }
});
