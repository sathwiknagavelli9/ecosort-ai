from __future__ import annotations

from .schemas import RecyclingGuidance

LOCAL_RULES_NOTE = "Check local recycling and municipal disposal rules before acting."

_RECOMMENDATIONS: dict[str, RecyclingGuidance] = {
    "cardboard": RecyclingGuidance(
        recyclable=True,
        category="Dry / recyclable waste",
        recommendation=(
            "Cardboard is commonly recyclable when clean and dry. Flatten it where practical; "
            "heavily food-contaminated cardboard may need a different disposal route."
        ),
        local_rules_note=LOCAL_RULES_NOTE,
    ),
    "glass": RecyclingGuidance(
        recyclable=True,
        category="Glass recycling / dry waste",
        recommendation=(
            "Many glass containers are recyclable. Empty and lightly rinse them where practical, "
            "and follow local instructions for broken glass because handling rules differ."
        ),
        local_rules_note=LOCAL_RULES_NOTE,
    ),
    "metal": RecyclingGuidance(
        recyclable=True,
        category="Metal recycling / dry waste",
        recommendation=(
            "Many cans and metal containers are recyclable. Empty and lightly clean the item where "
            "appropriate before placing it in an accepted local stream."
        ),
        local_rules_note=LOCAL_RULES_NOTE,
    ),
    "paper": RecyclingGuidance(
        recyclable=True,
        category="Paper recycling / dry waste",
        recommendation=(
            "Paper is commonly recyclable when clean and dry. Heavily soiled, waxed, laminated, "
            "or otherwise coated paper may not be accepted."
        ),
        local_rules_note=LOCAL_RULES_NOTE,
    ),
    "plastic": RecyclingGuidance(
        recyclable=None,
        category="Check resin code and local stream",
        recommendation=(
            "Plastic recyclability varies significantly by resin type, item format, contamination, "
            "and local facilities. Check the item's marking and your local program; not all plastic "
            "is recyclable."
        ),
        local_rules_note=LOCAL_RULES_NOTE,
    ),
    "trash": RecyclingGuidance(
        recyclable=False,
        category="General residual waste",
        recommendation=(
            "This result covers miscellaneous material outside the five named recyclable categories. "
            "Use the appropriate municipal residual-waste route; this label does not mean the item is "
            "hazardous."
        ),
        local_rules_note=LOCAL_RULES_NOTE,
    ),
}


def get_recommendation(class_name: str) -> RecyclingGuidance:
    try:
        return _RECOMMENDATIONS[class_name].model_copy(deep=True)
    except KeyError as exc:
        raise ValueError(f"No recycling recommendation for class {class_name!r}.") from exc


def supported_recommendation_classes() -> tuple[str, ...]:
    return tuple(_RECOMMENDATIONS)

