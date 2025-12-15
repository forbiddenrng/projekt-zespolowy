def build_cv_prompt(data: dict) -> str:
    return f"""
        Create a profssional CV for:
        Name: {data['name']}
        Experience: {data['experience']}
        Skills: {data['skills']}
    """