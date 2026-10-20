import { foodWithQuantity, formatFoodNumber } from './BalanceFoodModel';
import type { Food, QuantityDraft } from './BalanceFoodModel';

export function FoodQuantityFields({ food, draft, onChange }: { food: Food; draft: QuantityDraft; onChange: (draft: QuantityDraft) => void }) {
  const preview = foodWithQuantity(food, draft);
  return <>
    <div className="blw-quantity-fields">
      <label className="blw-field">Cantidad<input type="number" inputMode="decimal" min="0" step="any" required value={draft.quantity} onChange={(event) => onChange({ ...draft, quantity: event.target.value })} /></label>
      <label className="blw-field">Unidad<select value={draft.unit} onChange={(event) => {
        const unit = event.target.value as QuantityDraft['unit'];
        const canonical = preview?.canonicalQuantity ?? food.canonicalQuantity;
        const quantity = unit === 'portion' && food.portionOption ? canonical / food.portionOption.canonicalQuantity * food.portionOption.portionQuantity : canonical;
        onChange({ quantity: String(Number(quantity.toFixed(6))), unit });
      }}><option value="canonical">{food.nutritionSnapshot.canonicalUnit}</option>{food.portionOption && <option value="portion">{food.portionOption.name}</option>}</select></label>
    </div>
    {preview && <p className="blw-quantity-equivalence">{formatFoodNumber(preview.canonicalQuantity)} {food.nutritionSnapshot.canonicalUnit} consumidos</p>}
  </>;
}
