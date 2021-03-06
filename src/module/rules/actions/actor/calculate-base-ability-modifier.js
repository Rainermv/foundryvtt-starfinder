import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateBaseAbilityModifier", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;

        const addModifier = (bonus, ability) => {
            let abilityMod = 0;

            abilityMod += bonus.modifier;

            if (abilityMod !== 0) {
                ability.modifierTooltip.push(game.i18n.format("SFRPG.AbilityModifiersTooltip", {
                    type: bonus.type.capitalize(),
                    mod: bonus.modifier.signedString(),
                    source: bonus.name
                }));
            }

            return abilityMod;
        };

        const filteredMods = modifiers.filter(mod => {
            return mod.enabled && 
                [SFRPGEffectType.ABILITY_MODIFIER, SFRPGEffectType.ABILITY_MODIFIERS].includes(mod.effectType) && 
                [SFRPGModifierType.CONSTANT].includes(mod.modifierType);
        })

        for (let [abl, ability] of Object.entries(data.abilities)) {

            const abilityMods = context.parameters.stackModifiers.process(
                filteredMods.filter(mod => mod.valueAffected === abl || mod.effectType === SFRPGEffectType.ABILITY_MODIFIERS), 
                context
            );

            const base = Math.floor((ability.value - 10) / 2);
            ability.modifierTooltip = [game.i18n.format("SFRPG.AbilityModifierBase", { mod: base.signedString() })];

            let mod = Object.entries(abilityMods).reduce((sum, mod) => {
                if (mod[1] === null || mod[1].length < 1) return sum;

                if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                    for (const bonus of mod[1]) {
                        sum += addModifier(bonus, ability);
                    }
                } else {
                    sum += addModifier(mod[1], ability);
                }

                return sum;
            }, 0);

            let abilityModifier = base + mod;

            if (ability.damage) {
                let damage = -Math.floor(Math.abs(ability.damage) / 2);
                abilityModifier += damage;
                ability.modifierTooltip.push(game.i18n.format("SFRPG.AbilityDamageTooltip", { mod: damage.signedString() }));
            }

            ability.mod = abilityModifier;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}