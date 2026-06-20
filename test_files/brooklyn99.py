import time


SUSPECTS = ["Suspect 1", "Suspect 2", "Suspect 3", "Suspect 4", "Suspect 5"]
WITNESS = "Gwen"


def set_up_the_lineup():
    print(f"Jake: 'Okay Gwen, you said you never saw his face.'")
    print(f"Jake: 'But you heard him singing. So we're gonna do this a little differently.'")
    print(f"{WITNESS}: 'Is this... normal?'")
    print(f"Jake: 'Totally normal. Super normal. Let's go.'")
    return SUSPECTS


def make_the_suspects_sing(suspects):
    lyrics = [
        "You are my fire, the one desire",
        "Believe when I say",
        "I want it that way",
        "Tell me why",
        "Ain't nothin' but a heartache",
    ]
    print(f"[Jake lines up all five suspects]")
    time.sleep(1)
    for i, suspect in enumerate(suspects):
        print(f"{suspect}: '🎵 {lyrics[i]} 🎵'")
        time.sleep(0.5)
    return suspects


def jake_gets_too_into_it(suspects):
    print(f"Jake: 'Okay this is INCREDIBLE. Can we do the chorus together?'")
    print(f"{WITNESS}: 'I don't think that's—'")
    print(f"Jake: 'FROM THE TOP. ALL FIVE. GO.'")
    time.sleep(1)
    print(f"[All five suspects + Jake sing the full chorus in perfect a cappella harmony]")
    print(f"Jake: '🎵 I WANT IT THAT WAY 🎵'")
    print(f"Jake: [conducting with both hands, eyes closed]")
    time.sleep(1)
    print(f"[The room is silent. It was genuinely beautiful.]")
    return suspects


def oh_god_i_forgot_about_the_witness():
    print(f"Jake: '...okay. Wow. That was something special.'")
    time.sleep(1)
    print(f"{WITNESS}: 'It was number five. Number five killed my brother.'")
    time.sleep(1)
    print(f"Jake: 'Oh my God.'")
    print(f"Jake: 'I forgot about that part.'")
    return "Suspect 5 identified. Case closed. Jake's a cappella career: promising."


suspects = set_up_the_lineup()
suspects = make_the_suspects_sing(suspects)
suspects = jake_gets_too_into_it(suspects)
result = oh_god_i_forgot_about_the_witness()
print(result)
