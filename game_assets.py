	back_index = len(warehouse_1)
	first_pointer = 0
	second_pointer = 0
	new_list = []
	while len(new_list) < (x + y):
		if warehouse_1[first_pointer] != 0:
		  if warehouse_1[first_pointer] <= warehouse_2[second_pointer]:
			  new_list.append(warehouse_1[first_pointer])
			  first_pointer += 1
		  elif second_pointer < len(warehouse_2) - 1:
			  new_list.append(warehouse_2[second_pointer])
			  second_pointer += 1
		  else:
			  new_list.append(warehouse_1[first_pointer])
			  first_pointer += 1
	
		else:
			new_list.append(warehouse_2[second_pointer])
			second_pointer += 1
		
	return new_list