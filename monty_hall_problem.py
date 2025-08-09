import random

def monty_hall_simulation(trials: int):
    switch_wins = 0
    stay_wins = 0

    for _ in range(trials):
        # Randomly place the car behind one of the 3 doors
        doors = [0, 1, 2]
        car_position = random.choice(doors)

        # Player makes an initial choice
        player_choice = random.choice(doors)

        # Monty opens a door that is not the player's choice and not the car
        remaining_doors = [door for door in doors if door != player_choice and door != car_position]
        monty_opens = random.choice(remaining_doors)

        # Door to switch to (only one other unopened door left)
        switch_choice = [door for door in doors if door != player_choice and door != monty_opens][0]

        # Check outcomes
        if switch_choice == car_position:
            switch_wins += 1
        if player_choice == car_position:
            stay_wins += 1

    # Print results
    print(f"Total Trials: {trials}")
    print("\n--- Always Switch ---")
    print(f"Wins: {switch_wins}")
    print(f"Win Percentage: {100 * switch_wins / trials:.2f}%")

    print("\n--- Never Switch ---")
    print(f"Wins: {stay_wins}")
    print(f"Win Percentage: {100 * stay_wins / trials:.2f}%")

# Example usage
if __name__ == "__main__":
    X = int(input("Enter number of simulations to run: "))
    monty_hall_simulation(X)
