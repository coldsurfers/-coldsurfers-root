import { colors } from '@coldsurfers/ocean-road'
import { Text } from '@coldsurfers/ocean-road/native'
import { ReactNode } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export const HorizontalConcertItem = ({
  onPress,
  thumbnailComponent,
  title,
  subtitle,
  description,
  bottomRightAddOn,
}: {
  onPress?: () => void
  thumbnailComponent: ReactNode
  title: string
  subtitle: string
  description: string
  bottomRightAddOn?: ReactNode
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.itemWrapper}>
      {thumbnailComponent}
      <View style={styles.itemInnerRight}>
        <Text weight="bold" numberOfLines={1}>
          {title}
        </Text>
        <Text weight="medium" style={{ color: colors.oc.gray[7].value }}>
          {subtitle}
        </Text>
        <Text weight="medium" style={{ color: colors.oc.gray[8].value }}>
          {description}
        </Text>
      </View>
      {bottomRightAddOn && <View style={styles.bottomRight}>{bottomRightAddOn}</View>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemInnerRight: {
    marginLeft: 8,
    flex: 1,
  },
  bottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
})