import random
from game_assets import roots


def get_chords(root):
    chords = []
    for i in root.values():
        chords.append(i)
    return chords


def get_chord_types(root):
    chord_types = []
    for j in root.keys():
        chord_types.append(j)
    return chord_types


def play_chord_game(root):
    chords = get_chords(root)
    chord_types = get_chord_types(root)
    random.shuffle(chords)
    random.shuffle(chord_types)

    score = 0

    for s in chords:
        print(s)

    guess = input("Which chord is " + str(chord_types[3]) + "?")

    if guess == root[chord_types[3]]:
        print("Correct!")
        score += 1

    else:
        print("Incorrect :(")
        score -= 1

    print("Your score is: " + str(score))


play_chord_game(roots[0])
