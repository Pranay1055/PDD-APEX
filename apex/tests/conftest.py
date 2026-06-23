def pytest_collection_modifyitems(config, items):
    """Sort test items by their definition line number to preserve execution sequence."""
    items.sort(key=lambda item: item.location[1] if item.location else 0)
