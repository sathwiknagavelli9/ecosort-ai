from app.recommendations import get_recommendation, supported_recommendation_classes


def test_every_model_class_has_deterministic_guidance():
    expected = ("cardboard", "glass", "metal", "paper", "plastic", "trash")
    assert supported_recommendation_classes() == expected
    for class_name in expected:
        first = get_recommendation(class_name)
        second = get_recommendation(class_name)
        assert first == second
        assert first.recommendation
        assert "local" in first.local_rules_note.lower()


def test_plastic_does_not_claim_universal_recyclability():
    plastic = get_recommendation("plastic")
    assert plastic.recyclable is None
    assert "not all plastic is recyclable" in plastic.recommendation.lower()


def test_trash_is_not_automatically_described_as_hazardous():
    trash = get_recommendation("trash")
    assert trash.recyclable is False
    assert "does not mean" in trash.recommendation.lower()
    assert "hazardous" in trash.recommendation.lower()

