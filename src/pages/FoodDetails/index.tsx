import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {
  useNavigation,
  useRoute,
  NavigationHelpersContext,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
  isFavorite: boolean;
  selectedCategory: number;
}

interface ExtraValue {
  value: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const route = useRoute();

  const routeParams = route.params as Params;

  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(routeParams.isFavorite);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const response = await api.get(`foods/${routeParams.id}`);

      setFood({
        ...response.data,
        formattedPrice: formatValue(response.data.price),
      });
      const extrasAux: Extra[] = response.data.extras;

      setExtras(
        extrasAux.map(extra => ({
          id: extra.id,
          name: extra.name,
          value: extra.value,
          quantity: 0,
        })),
      );
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    setExtras(
      extras.map(extra =>
        extra.id === id
          ? {
              id: extra.id,
              name: extra.name,
              value: extra.value,
              quantity: extra.quantity + 1,
            }
          : extra,
      ),
    );
  }

  function handleDecrementExtra(id: number): void {
    setExtras(
      extras.map(extra =>
        extra.id === id && extra.quantity > 0
          ? {
              id: extra.id,
              name: extra.name,
              value: extra.value,
              quantity: extra.quantity - 1,
            }
          : extra,
      ),
    );
  }

  function handleIncrementFood(): void {
    const increment = foodQuantity;

    setFoodQuantity(increment + 1);
  }

  function handleDecrementFood(): void {
    const decrement = foodQuantity;

    if (foodQuantity > 1) {
      setFoodQuantity(decrement - 1);
    }
  }

  const toggleFavorite = useCallback(() => {
    async function setFavorite(): Promise<void> {
      try {
        console.log(food.id);
        if (isFavorite && food.id) {
          setIsFavorite(!isFavorite);
        }
        if (!isFavorite && food.id) {
          setIsFavorite(!isFavorite);
        }
      } catch (err) {
        console.log(err);
      }
    }

    setFavorite();
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    let extraTotal;

    if (extras.length) {
      extraTotal = extras.reduce(
        (accumulator: ExtraValue, extra: Extra) => {
          accumulator.value += extra.value * extra.quantity;

          return accumulator;
        },
        {
          value: 0,
        },
      );
    }

    return extraTotal
      ? formatValue(extraTotal.value + food.price * foodQuantity)
      : formatValue(0);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    await api.post('orders', {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: cartTotal,
      category: food.category,
      thumbnail_url: food.image_url,
      extras,
    });

    navigation.navigate('Home');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(() => {
    return isFavorite ? 'favorite' : 'favorite-border';
  }, [isFavorite]);

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
